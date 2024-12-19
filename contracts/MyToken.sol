pragma solidity >=0.4.23;

contract MyToken {
    string private _name;
    string private _symbol;
    uint8 private _decimals = 18;
    uint256 private _totalSupply;

    constructor(string name, string symbol) public {
        _name = name;
        _symbol = symbol;
        uint256 initialSupply = 1000000000 * 10 ** uint256(_decimals);
        _balances[msg.sender] = initialSupply;
        _totalSupply = initialSupply;
    }

    event Approval(address indexed src, address indexed guy, uint256 wad);
    event Transfer(address indexed src, address indexed dst, uint256 wad);

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) public _allowances;

    function name() public view returns (string) {
        return _name;
    }

    function symbol() public view returns (string) {
        return _symbol;
    }

    function decimals() public view returns (uint8) {
        return _decimals;
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address guy) public view returns (uint256) {
        return _balances[guy];
    }

    function allowance(address src, address guy) public view returns (uint256) {
        return _allowances[src][guy];
    }

    function approve(address guy, uint256 wad) public returns (bool) {
        _allowances[msg.sender][guy] = wad;
        emit Approval(msg.sender, guy, wad);
        return true;
    }

    function transfer(address dst, uint256 wad) public returns (bool) {
        return transferFrom(msg.sender, dst, wad);
    }

    function transferFrom(
        address src,
        address dst,
        uint256 wad
    ) public returns (bool) {
        require(_balances[src] >= wad);

        if (src != msg.sender && _allowances[src][msg.sender] != uint256(-1)) {
            require(_allowances[src][msg.sender] >= wad);
            _allowances[src][msg.sender] -= wad;
        }

        _balances[src] -= wad;
        _balances[dst] += wad;

        emit Transfer(src, dst, wad);

        return true;
    }
}
