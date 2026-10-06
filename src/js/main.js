import {
	CHAIN_CONFIGS,
	encodeEIP681,
	generatePaymentQR,
	generateQRFromURI,
	JPYCPaymentError,
	jpyToWei,
	normalizeAddress,
	validateGenerateOptions,
} from "jpyc-payment-qr";
import QRCode from "qrcode";
import * as form from "./payment-form.js";
import * as qrPanel from "./qr-panel.js";

async function renderQR(generate, uriLabel) {
	try {
		const qr = await generate();
		qrPanel.showQR(qr.data);
		qrPanel.showURI(qr.uri, uriLabel);
		return true;
	} catch (err) {
		qrPanel.showPlaceholder(
			err instanceof JPYCPaymentError
				? `エラー: ${err.message}`
				: "QRコードの生成に失敗しました",
		);
		qrPanel.hideURI();
		return false;
	}
}

async function updateQR() {
	const {
		merchantAddress,
		amountRaw,
		network,
		networkLabel,
		addressOnly,
		mainnetNetwork,
		testnet,
		testnetChainId,
	} = form.getValues();

	form.clearErrors();
	qrPanel.showWarnings([]);
	qrPanel.hideAddressOnlyNote();

	if (!merchantAddress && (addressOnly || !amountRaw)) {
		qrPanel.showPlaceholder(
			addressOnly
				? "アドレスを入力してください"
				: "アドレスと金額を入力してください",
		);
		qrPanel.hideURI();
		return;
	}

	const amount = amountRaw !== "" ? parseFloat(amountRaw) : undefined;

	const validation = validateGenerateOptions({
		merchantAddress: merchantAddress || undefined,
		amount,
		network: mainnetNetwork,
	});

	// アドレスのみモードでは金額は任意（未入力エラーを無視する）
	const errors = validation.issues
		.filter(
			(issue) => !(addressOnly && amountRaw === "" && issue.field === "amount"),
		)
		.map((issue) => issue.message);

	// Map validation errors to specific fields
	if (errors.length > 0) {
		for (const errMsg of errors) {
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

	if (addressOnly) {
		// EIP-681 非対応ウォレット向け: チェックサム付きアドレスのみを QR 化する。
		// v2 の generateQRFromURI は EIP-681 URI しか受け付けないため qrcode を直接使う。
		// ゼロアドレス・コントラクトアドレス・チェックサム不一致は上の validateGenerateOptions で検出済み
		const ok = await renderQR(async () => {
			const address = normalizeAddress(merchantAddress);
			const data = await QRCode.toDataURL(address, {
				errorCorrectionLevel: "M",
				width: 300,
				margin: 4,
			});
			return { data, uri: address };
		}, "QRコードの内容（受取アドレス）");
		if (ok) qrPanel.showAddressOnlyNote(networkLabel, amountRaw);
		return;
	}

	if (testnet) {
		await renderQR(() => {
			const jpycAddress = CHAIN_CONFIGS[mainnetNetwork].jpycAddress;
			const uri = encodeEIP681(
				jpycAddress,
				merchantAddress,
				jpyToWei(amount),
				testnetChainId,
			);
			return generateQRFromURI(uri);
		});
		return;
	}

	await renderQR(() => generatePaymentQR({ merchantAddress, amount, network }));
}

form.onInput(updateQR);
form.initAddressLock();
form.initTestnetToggle(updateQR);
form.initAddressOnlyToggle(updateQR);
qrPanel.initCopyButton();
