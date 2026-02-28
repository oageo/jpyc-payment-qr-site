const merchantAddressInput = document.getElementById("merchantAddress");
const amountInput = document.getElementById("amount");
const networkSelect = document.getElementById("network");
const merchantAddressError = document.getElementById("merchantAddress-error");
const amountError = document.getElementById("amount-error");
const testnetToggle = document.getElementById("testnet-toggle");

const MAINNET_NETWORKS = [
	{ value: "polygon", label: "Polygon" },
	{ value: "ethereum", label: "Ethereum" },
	{ value: "avalanche", label: "Avalanche" },
];

const TESTNET_NETWORKS = [
	{
		value: "polygon-amoy",
		label: "Polygon Amoy",
		chainId: 80002,
		mainnet: "polygon",
	},
	{
		value: "ethereum-sepolia",
		label: "Ethereum Sepolia",
		chainId: 11155111,
		mainnet: "ethereum",
	},
	{
		value: "avalanche-fuji",
		label: "Avalanche Fuji",
		chainId: 43113,
		mainnet: "avalanche",
	},
];

export function getValues() {
	const testnet = testnetToggle.checked;
	const network = networkSelect.value;
	const testnetConfig = TESTNET_NETWORKS.find((n) => n.value === network);
	return {
		merchantAddress: merchantAddressInput.value.trim(),
		amountRaw: amountInput.value,
		network,
		mainnetNetwork: testnet && testnetConfig ? testnetConfig.mainnet : network,
		testnet,
		testnetChainId: testnet && testnetConfig ? testnetConfig.chainId : null,
	};
}

export function showAddressError(message) {
	merchantAddressInput.classList.add("is-danger");
	merchantAddressError.textContent = message;
}

export function showAmountError(message) {
	amountInput.classList.add("is-danger");
	amountError.textContent = message;
}

export function clearErrors() {
	merchantAddressInput.classList.remove("is-danger");
	merchantAddressError.textContent = "";
	amountInput.classList.remove("is-danger");
	amountError.textContent = "";
}

function debounce(fn, delay) {
	let timer;
	return function (...args) {
		clearTimeout(timer);
		timer = setTimeout(() => fn.apply(this, args), delay);
	};
}

export function initAddressLock() {
	const lockToggle = document.getElementById("lock-address");
	lockToggle.addEventListener("change", () => {
		merchantAddressInput.readOnly = lockToggle.checked;
		merchantAddressInput.classList.toggle(
			"has-background-light",
			lockToggle.checked,
		);
	});
}

export function initTestnetToggle(callback) {
	testnetToggle.addEventListener("change", () => {
		const isTestnet = testnetToggle.checked;

		const currentNetwork = networkSelect.value;
		const networks = isTestnet ? TESTNET_NETWORKS : MAINNET_NETWORKS;
		networkSelect.innerHTML = "";
		for (const n of networks) {
			const opt = document.createElement("option");
			opt.value = n.value;
			opt.textContent = n.label;
			networkSelect.appendChild(opt);
		}

		if (isTestnet) {
			const equiv = TESTNET_NETWORKS.find((n) => n.mainnet === currentNetwork);
			if (equiv) networkSelect.value = equiv.value;
		} else {
			const equiv = TESTNET_NETWORKS.find((n) => n.value === currentNetwork);
			if (equiv) networkSelect.value = equiv.mainnet;
		}

		callback();
	});
}

export function onInput(callback) {
	merchantAddressInput.addEventListener("input", debounce(callback, 300));
	amountInput.addEventListener("input", callback);
	networkSelect.addEventListener("change", callback);
}
