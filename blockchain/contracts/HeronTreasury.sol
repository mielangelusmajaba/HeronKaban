// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title HeronTreasury
/// @notice Multi-org treasury for UMak student organizations. Each org has its own balance,
///         a list of signer officers and an approval threshold (at least 2). Funds leave only
///         when `threshold` distinct signers approve a request. The event log is the audit trail.
/// @dev Personal data never goes on-chain: only addresses, amounts, ids and hashes.
contract HeronTreasury is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Status {
        None,
        Pending,
        Released,
        Rejected,
        Cancelled
    }

    struct Org {
        address admin; // the President's wallet; may change signers (publicly, via SignersSet)
        uint8 threshold;
        uint256 balance;
        uint256 signersVersion; // bumps on every setSigners, invalidating old signer flags
        address[] signers;
    }

    struct Request {
        uint256 orgId;
        address requester;
        address payee;
        uint256 amount;
        uint256 eventId; // 0 = no event
        bytes32 receiptHash;
        Status status;
        uint8 approvals;
        uint256 signersVersion; // signer set the approvals were counted against
    }

    IERC20 public immutable token;

    uint256 public orgCount;
    uint256 public requestCount;

    mapping(uint256 => Org) private _orgs;
    /// orgId => signersVersion => account => isSigner
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) private _isSigner;
    mapping(uint256 => Request) private _requests;
    /// requestId => signersVersion => officer => approved
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) private _approved;
    mapping(bytes32 => bool) public receiptUsed;
    /// orgId => eventId => cap (0 = no cap)
    mapping(uint256 => mapping(uint256 => uint256)) public eventBudget;
    /// orgId => eventId => amount committed (pending + released)
    mapping(uint256 => mapping(uint256 => uint256)) public eventCommitted;

    event OrgCreated(uint256 indexed orgId, address indexed admin, address[] signers, uint8 threshold);
    event SignersSet(uint256 indexed orgId, address[] signers, uint8 threshold);
    event Deposited(uint256 indexed orgId, address indexed from, bytes32 indexed memberRef, uint256 amount);
    event RequestCreated(
        uint256 indexed requestId,
        uint256 indexed orgId,
        address indexed requester,
        address payee,
        uint256 amount,
        uint256 eventId,
        bytes32 receiptHash
    );
    event Approved(uint256 indexed requestId, uint256 indexed orgId, address indexed officer, uint8 approvals, uint8 threshold);
    event Released(uint256 indexed requestId, uint256 indexed orgId, address indexed payee, uint256 amount);
    event Rejected(uint256 indexed requestId, uint256 indexed orgId, address indexed officer);
    event Cancelled(uint256 indexed requestId, uint256 indexed orgId, address indexed requester);
    event EventBudgetSet(uint256 indexed orgId, uint256 indexed eventId, uint256 cap);

    error UnknownOrg();
    error UnknownRequest();
    error NotOrgAdmin();
    error NotSigner();
    error BadSigners();
    error BadThreshold();
    error ZeroAmount();
    error ZeroAddress();
    error ReceiptAlreadyUsed();
    error NotPending();
    error AlreadyApproved();
    error InsufficientBalance();
    error OverEventBudget();
    error NotRequester();

    constructor(IERC20 token_) {
        token = token_;
    }

    // ───────────────────────── Orgs & signers ─────────────────────────

    function createOrg(address[] calldata signers, uint8 threshold) external returns (uint256 orgId) {
        orgId = ++orgCount;
        _orgs[orgId].admin = msg.sender;
        _setSigners(orgId, signers, threshold);
        emit OrgCreated(orgId, msg.sender, signers, threshold);
    }

    /// @notice Replace the signer list. Pending requests must be re-approved by the new set.
    function setSigners(uint256 orgId, address[] calldata signers, uint8 threshold) external {
        Org storage org = _org(orgId);
        if (msg.sender != org.admin) revert NotOrgAdmin();
        _setSigners(orgId, signers, threshold);
        emit SignersSet(orgId, signers, threshold);
    }

    function setEventBudget(uint256 orgId, uint256 eventId, uint256 cap) external {
        Org storage org = _org(orgId);
        if (msg.sender != org.admin && !_isSigner[orgId][org.signersVersion][msg.sender]) revert NotSigner();
        eventBudget[orgId][eventId] = cap;
        emit EventBudgetSet(orgId, eventId, cap);
    }

    function _setSigners(uint256 orgId, address[] calldata signers, uint8 threshold) private {
        if (signers.length < 2) revert BadSigners();
        if (threshold < 2 || threshold > signers.length) revert BadThreshold();
        Org storage org = _orgs[orgId];
        uint256 version = ++org.signersVersion;
        for (uint256 i = 0; i < signers.length; i++) {
            address s = signers[i];
            if (s == address(0) || _isSigner[orgId][version][s]) revert BadSigners(); // no zero, no duplicates
            _isSigner[orgId][version][s] = true;
        }
        org.signers = signers;
        org.threshold = threshold;
    }

    // ───────────────────────── Money in ─────────────────────────

    /// @param memberRef pseudonymous member reference (e.g. keccak256 of an app user id), never a name
    function deposit(uint256 orgId, uint256 amount, bytes32 memberRef) external nonReentrant {
        Org storage org = _org(orgId);
        if (amount == 0) revert ZeroAmount();
        token.safeTransferFrom(msg.sender, address(this), amount);
        org.balance += amount;
        emit Deposited(orgId, msg.sender, memberRef, amount);
    }

    // ───────────────────────── Money out ─────────────────────────

    function createRequest(uint256 orgId, uint256 amount, address payee, uint256 eventId, bytes32 receiptHash)
        external
        returns (uint256 requestId)
    {
        Org storage org = _org(orgId);
        if (!_isSigner[orgId][org.signersVersion][msg.sender]) revert NotSigner();
        if (amount == 0) revert ZeroAmount();
        if (payee == address(0)) revert ZeroAddress();
        if (receiptUsed[receiptHash]) revert ReceiptAlreadyUsed();
        uint256 cap = eventBudget[orgId][eventId];
        if (cap != 0 && eventCommitted[orgId][eventId] + amount > cap) revert OverEventBudget();

        receiptUsed[receiptHash] = true;
        eventCommitted[orgId][eventId] += amount;

        requestId = ++requestCount;
        _requests[requestId] = Request({
            orgId: orgId,
            requester: msg.sender,
            payee: payee,
            amount: amount,
            eventId: eventId,
            receiptHash: receiptHash,
            status: Status.Pending,
            approvals: 0,
            signersVersion: org.signersVersion
        });
        emit RequestCreated(requestId, orgId, msg.sender, payee, amount, eventId, receiptHash);
    }

    /// @notice Approve a pending request. Releases funds automatically when the threshold is met.
    function approve(uint256 requestId) external nonReentrant {
        Request storage r = _request(requestId);
        if (r.status != Status.Pending) revert NotPending();
        Org storage org = _orgs[r.orgId];
        uint256 version = org.signersVersion;
        if (!_isSigner[r.orgId][version][msg.sender]) revert NotSigner();

        // If signers changed since the last approval, start the count again under the new set.
        if (r.signersVersion != version) {
            r.signersVersion = version;
            r.approvals = 0;
        }
        if (_approved[requestId][version][msg.sender]) revert AlreadyApproved();
        _approved[requestId][version][msg.sender] = true;
        r.approvals += 1;
        emit Approved(requestId, r.orgId, msg.sender, r.approvals, org.threshold);

        if (r.approvals >= org.threshold) {
            if (org.balance < r.amount) revert InsufficientBalance();
            r.status = Status.Released;
            org.balance -= r.amount;
            token.safeTransfer(r.payee, r.amount);
            emit Released(requestId, r.orgId, r.payee, r.amount);
        }
    }

    /// @notice Any signer can reject a pending request (veto). No funds move.
    function reject(uint256 requestId) external {
        Request storage r = _request(requestId);
        if (r.status != Status.Pending) revert NotPending();
        Org storage org = _orgs[r.orgId];
        if (!_isSigner[r.orgId][org.signersVersion][msg.sender]) revert NotSigner();
        r.status = Status.Rejected;
        eventCommitted[r.orgId][r.eventId] -= r.amount;
        emit Rejected(requestId, r.orgId, msg.sender);
    }

    /// @notice The requester can withdraw their own pending request. No funds move.
    function cancel(uint256 requestId) external {
        Request storage r = _request(requestId);
        if (r.status != Status.Pending) revert NotPending();
        if (msg.sender != r.requester) revert NotRequester();
        r.status = Status.Cancelled;
        eventCommitted[r.orgId][r.eventId] -= r.amount;
        emit Cancelled(requestId, r.orgId, msg.sender);
    }

    // ───────────────────────── Views ─────────────────────────

    function getOrg(uint256 orgId)
        external
        view
        returns (address admin, uint8 threshold, uint256 balance, address[] memory signers)
    {
        Org storage org = _org(orgId);
        return (org.admin, org.threshold, org.balance, org.signers);
    }

    function isSigner(uint256 orgId, address account) external view returns (bool) {
        Org storage org = _org(orgId);
        return _isSigner[orgId][org.signersVersion][account];
    }

    function getRequest(uint256 requestId) external view returns (Request memory) {
        return _request(requestId);
    }

    function hasApproved(uint256 requestId, address officer) external view returns (bool) {
        Request storage r = _request(requestId);
        return _approved[requestId][r.signersVersion][officer];
    }

    function _org(uint256 orgId) private view returns (Org storage org) {
        org = _orgs[orgId];
        if (org.admin == address(0)) revert UnknownOrg();
    }

    function _request(uint256 requestId) private view returns (Request storage r) {
        r = _requests[requestId];
        if (r.status == Status.None) revert UnknownRequest();
    }
}
