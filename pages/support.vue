<script setup lang="ts">
definePageMeta({ layout: 'default' })

const title = 'Support jscpd'
const description = 'jscpd has been free and open source since 2013. If it saves your team time, here is how to support its development.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})

// Addresses are checksum-validated and must match the public/qr-*.svg
// files and the list published in the repository README
const networks = [
  {
    key: 'evm',
    tab: 'ETH / BNB / Polygon',
    label: 'Ethereum · BNB Smart Chain · Polygon (same address, ERC-20/BEP-20 welcome)',
    address: '0xf92027E8121b1734cDDC430b7B0085681d843ae2',
    qr: '/qr-evm.svg'
  },
  {
    key: 'btc',
    tab: 'Bitcoin',
    label: 'Bitcoin (BTC)',
    address: 'bc1q8q57dulp7jg7dzzysd2n2yw080qg80cuv48228',
    qr: '/qr-btc.svg'
  },
  {
    key: 'sol',
    tab: 'Solana',
    label: 'Solana (SOL)',
    address: '9JGCG3xyE23qBGxtvudo5kVMLRhAzxbrkzAfB7Cw8YkT',
    qr: '/qr-sol.svg'
  },
  {
    key: 'tron',
    tab: 'Tron',
    label: 'Tron (TRX · TRC-20)',
    address: 'TTV8SYFKNhfSRe2J2WBXezSZrCvMLNXiea',
    qr: '/qr-tron.svg'
  }
]

const activeKey = ref('evm')
const active = computed(() => networks.find(n => n.key === activeKey.value)!)
const copied = ref(false)

watch(activeKey, () => { copied.value = false; walletStatus.value = 'idle'; walletMessage.value = '' })

// Direct donation via an injected EIP-1193 wallet (MetaMask etc.) — EVM only.
// The wallet signs and sends; this page never touches keys or funds.
// What can be sent from the wallet: the native coin of each EVM chain, or
// USDT via its official token contract on that chain. Contract addresses:
// Ethereum 0xdAC17…1ec7 (6 dec), BNB Chain 0x55d3…7955 (18 dec, Binance-Peg),
// Polygon 0xc213…8e8F (6 dec, PoS).
const CHAINS = {
  eth: {
    chainId: '0x1',
    name: 'Ethereum'
  },
  bnb: {
    chainId: '0x38',
    name: 'BNB Smart Chain',
    add: {
      chainId: '0x38',
      chainName: 'BNB Smart Chain',
      nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
      rpcUrls: ['https://bsc-dataseed.binance.org'],
      blockExplorerUrls: ['https://bscscan.com']
    }
  },
  pol: {
    chainId: '0x89',
    name: 'Polygon',
    add: {
      chainId: '0x89',
      chainName: 'Polygon Mainnet',
      nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
      rpcUrls: ['https://polygon-rpc.com'],
      blockExplorerUrls: ['https://polygonscan.com']
    }
  }
} as const

const sendOptions = [
  { key: 'usdt-eth', chain: CHAINS.eth, symbol: 'USDT', label: 'USDT on Ethereum', defaultAmount: '10', token: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 } },
  { key: 'usdt-bnb', chain: CHAINS.bnb, symbol: 'USDT', label: 'USDT on BNB Chain', defaultAmount: '10', token: { address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 } },
  { key: 'usdt-pol', chain: CHAINS.pol, symbol: 'USDT', label: 'USDT on Polygon', defaultAmount: '10', token: { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 } },
  { key: 'eth', chain: CHAINS.eth, symbol: 'ETH', label: 'Ethereum (ETH)', defaultAmount: '0.01', token: null },
  { key: 'bnb', chain: CHAINS.bnb, symbol: 'BNB', label: 'BNB Chain (BNB)', defaultAmount: '0.05', token: null },
  { key: 'pol', chain: CHAINS.pol, symbol: 'POL', label: 'Polygon (POL)', defaultAmount: '10', token: null }
]

const donateKey = ref('usdt-eth')
const donateOption = computed(() => sendOptions.find(o => o.key === donateKey.value)!)
const donateAmount = ref(sendOptions[0].defaultAmount)
const walletStatus = ref<'idle' | 'pending' | 'done' | 'error'>('idle')
const walletMessage = ref('')

watch(donateKey, () => {
  donateAmount.value = donateOption.value.defaultAmount
  walletStatus.value = 'idle'
  walletMessage.value = ''
})

const donateLabel = computed(() => {
  const n = Number(donateAmount.value)
  const amount = Number.isFinite(n) && n > 0 ? donateAmount.value : '…'
  return `Send ${amount} ${donateOption.value.symbol}`
})

// amount → smallest units without float drift: 6 fractional digits of
// precision, then scale by the remaining decimals
function toUnits(amount: number, decimals: number): bigint {
  return BigInt(Math.round(amount * 1e6)) * 10n ** BigInt(decimals - 6)
}

async function donateWithWallet() {
  const eth = (window as any).ethereum
  if (!eth) {
    walletStatus.value = 'error'
    walletMessage.value = 'No EVM wallet detected in this browser — install MetaMask or copy the address instead.'
    return
  }
  const amount = Number(donateAmount.value)
  if (!Number.isFinite(amount) || amount <= 0) {
    walletStatus.value = 'error'
    walletMessage.value = 'Enter a valid amount.'
    return
  }
  const opt = donateOption.value
  try {
    walletStatus.value = 'pending'
    walletMessage.value = 'Confirm in your wallet…'
    const [from] = await eth.request({ method: 'eth_requestAccounts' })
    // make sure the wallet is on the chain the visitor chose, so the
    // currency sent is exactly the one displayed
    try {
      await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: opt.chain.chainId }] })
    } catch (switchErr: any) {
      if (switchErr?.code === 4902 && (opt.chain as any).add) {
        await eth.request({ method: 'wallet_addEthereumChain', params: [(opt.chain as any).add] })
      } else {
        throw switchErr
      }
    }
    const recipient = networks[0].address
    let tx
    if (opt.token) {
      // ERC-20 transfer(address,uint256) via the official USDT contract
      const units = toUnits(amount, opt.token.decimals)
      const data = '0xa9059cbb'
        + recipient.slice(2).toLowerCase().padStart(64, '0')
        + units.toString(16).padStart(64, '0')
      tx = { from, to: opt.token.address, value: '0x0', data }
    } else {
      const wei = toUnits(amount, 18)
      tx = { from, to: recipient, value: '0x' + wei.toString(16) }
    }
    const txHash = await eth.request({ method: 'eth_sendTransaction', params: [tx] })
    walletStatus.value = 'done'
    walletMessage.value = `Thank you! ${amount} ${opt.symbol} on ${opt.chain.name} sent — tx ${txHash.slice(0, 10)}…${txHash.slice(-6)}`
  } catch (e: any) {
    walletStatus.value = 'error'
    walletMessage.value = e?.code === 4001 ? 'Cancelled in the wallet.' : (e?.message || 'Wallet request failed.')
  }
}

async function copyAddress() {
  try {
    await navigator.clipboard.writeText(active.value.address)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch { /* clipboard unavailable — the address is selectable text */ }
}
</script>

<template>
  <div class="support-page">
    <section class="support-hero">
      <h1 class="support-title">
        Support <span class="hero-gradient">jscpd</span>
      </h1>
      <p class="support-subtitle">
        jscpd has been free and open source since 2013 — 10M+ downloads a month,
        maintained in spare time. If it saves your team time, here's how to give back.
      </p>
    </section>

    <section class="support-options">
      <div class="support-card support-card-primary">
        <div class="support-card-head">
          <Icon name="simple-icons:opencollective" class="support-card-icon" />
          <h2 class="support-card-title">Open Collective</h2>
          <span class="support-card-badge">Recommended</span>
        </div>
        <p class="support-card-desc">
          The best way to support jscpd — one-off or recurring. Fully transparent budget,
          and companies get proper invoices for accounting.
        </p>
        <UButton
          to="https://opencollective.com/jscpd"
          target="_blank"
          color="primary"
          size="lg"
          icon="i-lucide-heart"
          label="Sponsor on Open Collective"
        />
      </div>

      <div class="support-card">
        <div class="support-card-head">
          <Icon name="simple-icons:ethereum" class="support-card-icon" />
          <h2 class="support-card-title">Prefer crypto?</h2>
        </div>
        <p class="support-card-desc">
          Donations on several networks are welcome. The same addresses are published in the
          <a href="https://github.com/kucherenko/jscpd.dev/blob/master/README.md" target="_blank" rel="noopener">site repository</a>
          so you can cross-check them.
        </p>
        <div class="crypto-tabs" role="tablist">
          <button
            v-for="n in networks"
            :key="n.key"
            role="tab"
            :aria-selected="activeKey === n.key"
            :class="['crypto-tab', { active: activeKey === n.key }]"
            @click="activeKey = n.key"
          >{{ n.tab }}</button>
        </div>
        <div class="eth-row">
          <img :src="active.qr" :alt="`QR code of the ${active.label} donation address`" class="eth-qr" width="112" height="112">
          <div class="eth-address-box">
            <span class="eth-label">{{ active.label }}</span>
            <code class="eth-address">{{ active.address }}</code>
            <button class="eth-copy" @click="copyAddress">
              <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" class="eth-copy-icon" />
              {{ copied ? 'Copied!' : 'Copy address' }}
            </button>
          </div>
        </div>

        <ClientOnly>
          <div v-if="activeKey === 'evm'" class="wallet-donate">
            <span class="eth-label">Or send directly from your wallet</span>
            <div class="wallet-donate-row">
              <select v-model="donateKey" class="wallet-chain-select" aria-label="Currency and network">
                <option v-for="o in sendOptions" :key="o.key" :value="o.key">{{ o.label }}</option>
              </select>
              <div class="wallet-amount">
                <input
                  v-model="donateAmount"
                  type="text"
                  inputmode="decimal"
                  class="wallet-amount-input"
                  :aria-label="`Donation amount in ${donateOption.symbol}`"
                >
                <span class="wallet-amount-unit">{{ donateOption.symbol }}</span>
              </div>
              <button class="wallet-donate-btn" :disabled="walletStatus === 'pending'" @click="donateWithWallet">
                <Icon name="lucide:wallet" class="wallet-donate-icon" />
                {{ walletStatus === 'pending' ? 'Waiting for wallet…' : donateLabel }}
              </button>
            </div>
            <p v-if="walletMessage" class="wallet-message" :class="`wallet-message-${walletStatus}`">{{ walletMessage }}</p>
            <p class="wallet-hint">
              Opens your browser wallet (MetaMask or any compatible wallet), switches it to
              {{ donateOption.chain.name }}, and sends
              {{ donateOption.token ? `USDT via the official token contract` : donateOption.symbol }}
              to the address above. For USDT on Tron, use the Tron tab.
            </p>
          </div>
        </ClientOnly>
      </div>

      <div class="support-card">
        <div class="support-card-head">
          <Icon name="lucide:hand-heart" class="support-card-icon" />
          <h2 class="support-card-title">No budget? No problem</h2>
        </div>
        <p class="support-card-desc">
          Starring the repo, reporting bugs, improving docs, or telling a colleague
          about jscpd helps more than you'd think.
        </p>
        <div class="support-links">
          <UButton
            to="https://github.com/kucherenko/jscpd"
            target="_blank"
            color="neutral"
            variant="outline"
            icon="i-simple-icons-github"
            label="Star on GitHub"
          />
          <UButton
            to="https://github.com/kucherenko/jscpd/issues"
            target="_blank"
            color="neutral"
            variant="outline"
            icon="i-lucide-bug"
            label="Report an issue"
          />
        </div>
      </div>

      <p class="support-contact">
        Interested in other forms of support — company sponsorship, invoicing, or something custom?
        <a href="mailto:kucherenko.andrey@gmail.com?subject=Supporting%20jscpd">Get in touch</a>.
      </p>
    </section>
  </div>
</template>

<style scoped>
.support-page {
  max-width: 44rem;
  margin: 0 auto;
  padding: 0 1rem 4rem;
}

.support-hero {
  text-align: center;
  padding: 4rem 0 2.5rem;
}

.support-title {
  font-size: clamp(1.875rem, 5vw, 3rem);
  font-weight: 800;
  line-height: 1.15;
  margin: 0 0 1rem;
  color: var(--ui-text-highlighted, inherit);
}

.support-subtitle {
  max-width: 36rem;
  margin: 0 auto;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--ui-text-muted, #64748b);
}

.support-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.support-card {
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  border-radius: 0.875rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  align-items: flex-start;
}

.support-card-primary {
  border-color: rgba(0, 123, 255, 0.35);
  background: linear-gradient(to bottom right, rgba(0, 123, 255, 0.05), rgba(178, 0, 178, 0.05));
}

.support-card-head {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex-wrap: wrap;
}

.support-card-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--jscpd-blue, #007bff);
}

.support-card-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--ui-text-highlighted, inherit);
}

.support-card-badge {
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  color: var(--jscpd-blue, #007bff);
  border: 1px solid rgba(0, 123, 255, 0.3);
}

.support-card-desc {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.55;
  color: var(--ui-text-muted, #64748b);
}

.support-card-desc a {
  color: var(--jscpd-blue, #007bff);
  text-decoration: none;
}

.support-card-desc a:hover {
  text-decoration: underline;
}

.crypto-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.crypto-tab {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  background: transparent;
  color: var(--ui-text-muted, #64748b);
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.crypto-tab:hover {
  color: var(--jscpd-blue, #007bff);
  border-color: rgba(0, 123, 255, 0.4);
}

.crypto-tab.active {
  color: #fff;
  background: var(--jscpd-blue, #007bff);
  border-color: var(--jscpd-blue, #007bff);
}

.eth-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  width: 100%;
}

.eth-qr {
  width: 7rem;
  height: 7rem;
  border-radius: 0.5rem;
  background: #fff;
  padding: 0.25rem;
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  flex-shrink: 0;
}

.eth-address-box {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  min-width: 0;
  flex: 1;
}

.eth-label {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-text-muted, #64748b);
}

.eth-address {
  font-family: 'SF Mono', 'Fira Code', ui-monospace, monospace;
  font-size: 0.75rem;
  padding: 0.5rem 0.625rem;
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  border-radius: 0.5rem;
  overflow-wrap: anywhere;
  user-select: all;
  color: var(--ui-text-highlighted, inherit);
  background: var(--ui-bg-muted, rgba(100, 116, 139, 0.06));
}

.eth-copy {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  align-self: flex-start;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  background: transparent;
  color: var(--ui-text-muted, #64748b);
  cursor: pointer;
  transition: all 0.2s ease;
}

.eth-copy:hover {
  color: var(--jscpd-blue, #007bff);
  border-color: rgba(0, 123, 255, 0.4);
}

.eth-copy-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.wallet-donate {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  padding-top: 0.75rem;
  border-top: 1px solid var(--ui-border, rgba(100, 116, 139, 0.15));
}

.wallet-donate-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.wallet-chain-select {
  padding: 0.45rem 0.625rem;
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  border-radius: 0.5rem;
  background: transparent;
  font-size: 0.8125rem;
  color: var(--ui-text-highlighted, inherit);
  cursor: pointer;
}

.wallet-chain-select option {
  color: initial;
}

.wallet-amount {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  border: 1px solid var(--ui-border, rgba(100, 116, 139, 0.25));
  border-radius: 0.5rem;
  padding: 0 0.625rem;
}

.wallet-amount-input {
  width: 5rem;
  padding: 0.45rem 0;
  border: none;
  background: transparent;
  font-family: 'SF Mono', 'Fira Code', ui-monospace, monospace;
  font-size: 0.8125rem;
  color: var(--ui-text-highlighted, inherit);
  outline: none;
}

.wallet-amount-unit {
  font-size: 0.6875rem;
  color: var(--ui-text-muted, #64748b);
  white-space: nowrap;
}

.wallet-donate-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.875rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(0, 123, 255, 0.35);
  background: var(--jscpd-blue, #007bff);
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.wallet-donate-btn:hover:not(:disabled) {
  background: var(--jscpd-magenta, #B200B2);
  border-color: var(--jscpd-magenta, #B200B2);
}

.wallet-donate-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

.wallet-donate-icon {
  width: 0.875rem;
  height: 0.875rem;
}

.wallet-message {
  margin: 0;
  font-size: 0.75rem;
}

.wallet-message-done { color: #16a34a; }
.wallet-message-error { color: #dc2626; }
.wallet-message-pending { color: var(--ui-text-muted, #64748b); }

.wallet-hint {
  margin: 0;
  font-size: 0.6875rem;
  line-height: 1.5;
  color: var(--ui-text-muted, #64748b);
}

.support-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.support-contact {
  margin: 0.5rem 0 0;
  text-align: center;
  font-size: 0.875rem;
  color: var(--ui-text-muted, #64748b);
}

.support-contact a {
  color: var(--jscpd-blue, #007bff);
  text-decoration: none;
  font-weight: 500;
}

.support-contact a:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .support-hero {
    padding: 2.5rem 0 1.75rem;
  }
}
</style>
