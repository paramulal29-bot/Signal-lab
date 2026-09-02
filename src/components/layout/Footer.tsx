export function Footer() {
  return (
    <footer className="mt-12 border-t border-rule py-8">
      <div className="mx-auto max-w-7xl space-y-2 px-4 text-[11px] leading-relaxed text-ink-faint sm:px-6">
        <p className="font-semibold tracking-[0.12em] text-ink-dim">SIGNALLAB — TRAINING SIMULATOR</p>
        <p>
          Educational paper-trading practice on public market data. Not financial advice. No
          exchange, broker or wallet is connected, no real orders are placed, and no real money is
          ever involved.
        </p>
        <p>
          Signal Strength measures setup clarity, never probability of profit. Simulated and
          backtested results do not indicate future or real-world performance. Trading
          cryptocurrency carries substantial risk of loss.
        </p>
      </div>
    </footer>
  )
}
