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

watch(activeKey, () => { copied.value = false })

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
