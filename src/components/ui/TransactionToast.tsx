import toast from "react-hot-toast";

const BASESCAN_URL = "https://sepolia.basescan.org";

export function showTransactionToast(
  hash: string,
  status: "pending" | "success" | "error",
  message?: string
) {
  const txUrl = `${BASESCAN_URL}/tx/${hash}`;

  if (status === "pending") {
    return toast.loading(
      <div className="flex flex-col gap-1">
        <p className="font-semibold">{message || "Transaction pending..."}</p>
        <a
          href={txUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-300 hover:text-blue-200 underline"
        >
          View on BaseScan →
        </a>
      </div>,
      { id: hash, duration: Infinity }
    );
  }

  if (status === "success") {
    return toast.success(
      <div className="flex flex-col gap-1">
        <p className="font-semibold">{message || "Transaction confirmed!"}</p>
        <a
          href={txUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-green-300 hover:text-green-200 underline"
        >
          View on BaseScan →
        </a>
      </div>,
      { id: hash, duration: 6000 }
    );
  }

  if (status === "error") {
    return toast.error(
      <div className="flex flex-col gap-1">
        <p className="font-semibold">{message || "Transaction failed"}</p>
        <a
          href={txUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-red-300 hover:text-red-200 underline"
        >
          View on BaseScan →
        </a>
      </div>,
      { id: hash, duration: 8000 }
    );
  }
}

export function dismissTransactionToast(hash: string) {
  toast.dismiss(hash);
}
