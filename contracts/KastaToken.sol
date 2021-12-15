// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;
import "@openzeppelin/contracts-upgradeable/token/ERC20/presets/ERC20PresetFixedSupplyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract KastaToken is
    Initializable,
    ERC20PresetFixedSupplyUpgradeable,
    ERC20PausableUpgradeable,
    AccessControlEnumerableUpgradeable
{
    mapping(address => uint256) private _staked;
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    event Staked(address indexed from, uint256 amount);
    event Unstaked(address indexed from, uint256 amount);

    /**
     * @dev Initializes the contract total supply and setup access roles
     */
    function initialize(address multisigWallet) public initializer {
        ERC20PresetFixedSupplyUpgradeable.initialize(
            "KastaToken",
            "KASTA",
            1500000000 * (10**decimals()),
            multisigWallet
        );
        _setupRole(PAUSER_ROLE, multisigWallet);
        _setupRole(DEFAULT_ADMIN_ROLE, multisigWallet);
    }

    /**
     * @dev Returns the amount staked for a given user
     */
    function balanceStaked(address account) public view returns (uint256) {
        return _staked[account];
    }

    /**
     * @dev Returns the amount unstaked for a given user
     */
    function balanceUnstaked(address account) public view returns (uint256) {
        return balanceOf(account);
    }

    /**
     * @dev Stakes `amount` tokens to `caller` and sends the tokens to the contract
     *
     * Requirements:
     *
     * - the amount should be greater than zero
     * - the contract can't be paused
     * - the amount can't be greater than the user balance minus the amount already staked
     */
    function stake(uint256 amount) external {
        require(amount > 0, "KastaToken: Cannot stake 0 tokens");
        require(!paused(), "KastaToken: Cannot stake tokens while paused");
        require(
            !hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
            "KastaToken: admin role cannot stake tokens"
        );

        uint256 totalUserBalanceUnstaked = balanceUnstaked(_msgSender());
        require(
            totalUserBalanceUnstaked >= amount,
            "KastaToken: Cannot stake more tokens than unstaked balance"
        );

        _staked[_msgSender()] = balanceStaked(_msgSender()) + amount;
        require(
            transfer(address(this), amount),
            "KastaToken: Transfer staked tokens failed"
        );

        emit Staked(_msgSender(), amount);
    }

    /**
     * @dev Unstakes `amount` tokens from `caller` and return the tokens to the user
     *
     * Requirements:
     *
     * - the amount should be greater than zero
     * - the contract cant't be paused
     * - the amount can't be greater than the user staked balance
     */
    function unstake(uint256 amount) external {
        require(amount > 0, "KastaToken: Cannot unstake 0 tokens");
        require(!paused(), "KastaToken: Cannot unstake tokens while paused");

        uint256 userbalanceStaked = balanceStaked(_msgSender());

        require(
            userbalanceStaked >= amount,
            "KastaToken: Cannot unstake more tokens than staked balance"
        );

        _staked[_msgSender()] = balanceStaked(_msgSender()) - amount;
        _transfer(address(this), _msgSender(), amount);

        emit Unstaked(_msgSender(), amount);
    }

    /**
     * @dev Pauses all token transfers.
     *
     * Requirements:
     *
     * - the caller must have the `PAUSER_ROLE`.
     */
    function pause() public {
        require(
            hasRole(PAUSER_ROLE, _msgSender()),
            "KastaToken: must have pauser role to pause"
        );
        _pause();
    }

    /**
     * @dev Unpauses all token transfers.
     *
     * Requirements:
     *
     * - the caller must have the `PAUSER_ROLE`.
     */
    function unpause() public {
        require(
            hasRole(PAUSER_ROLE, _msgSender()),
            "KastaToken: must have pauser role to unpause"
        );
        _unpause();
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20PausableUpgradeable, ERC20Upgradeable) {
        super._beforeTokenTransfer(from, to, amount);
    }
}
