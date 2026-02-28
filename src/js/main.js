import {
	CHAIN_CONFIGS,
	encodeEIP681,
	generatePaymentQR,
	generateQRFromURI,
	JPYCPaymentError,
	jpyToWei,
	validateGenerateOptions,
} from "jpyc-payment-qr";
import * as form from "./payment-form.js";
import * as qrPanel from "./qr-panel.js";

async function updateQR() {
	const {
		merchantAddress,
		amountRaw,
		network,
		mainnetNetwork,
		testnet,
		testnetChainId,
	} = form.getValues();

	form.clearErrors();
	qrPanel.showWarnings([]);

	if (!merchantAddress && !amountRaw) {
		qrPanel.showPlaceholder("アドレスと金額を入力してください");
		qrPanel.hideURI();
		return;
	}

	const amount = amountRaw !== "" ? parseFloat(amountRaw) : undefined;

	const validation = validateGenerateOptions({
		merchantAddress: merchantAddress || undefined,
		amount,
		network: mainnetNetwork,
	});

	// Map validation errors to specific fields
	if (!validation.valid) {
		for (const errMsg of validation.errors) {
			if (errMsg.includes("merchantAddress") || errMsg.includes("アドレス")) {
				form.showAddressError(errMsg);
			} else if (errMsg.includes("amount") || errMsg.includes("金額")) {
				form.showAmountError(errMsg);
			}
		}
		qrPanel.showPlaceholder("入力内容を確認してください");
		qrPanel.hideURI();
		return;
	}

	qrPanel.showWarnings(validation.warnings);

	if (testnet) {
		try {
			const jpycAddress = CHAIN_CONFIGS[mainnetNetwork].jpycAddress;
			const uri = encodeEIP681(
				jpycAddress,
				merchantAddress,
				jpyToWei(amount),
				testnetChainId,
			);
			const qr = await generateQRFromURI(uri);
			qrPanel.showQR(qr.data);
			qrPanel.showURI(uri);
		} catch (err) {
			qrPanel.showPlaceholder(
				err instanceof JPYCPaymentError
					? `エラー: ${err.message}`
					: "QRコードの生成に失敗しました",
			);
			qrPanel.hideURI();
		}
		return;
	}

	try {
		const qr = await generatePaymentQR({ merchantAddress, amount, network });
		qrPanel.showQR(qr.data);
		qrPanel.showURI(qr.uri);
	} catch (err) {
		qrPanel.showPlaceholder(
			err instanceof JPYCPaymentError
				? `エラー: ${err.message}`
				: "QRコードの生成に失敗しました",
		);
		qrPanel.hideURI();
	}
}

form.onInput(updateQR);
form.initAddressLock();
form.initTestnetToggle(updateQR);
qrPanel.initCopyButton();
