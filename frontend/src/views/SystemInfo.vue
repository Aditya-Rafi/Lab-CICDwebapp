<template>
  <div class="system-info-view">
    <div class="view-header">
      <div>
        <h1>System Version & Changelog</h1>
        <p class="subtitle">Semantic Versioning rules and release timeline tracking</p>
      </div>
    </div>

    <div class="system-grid">
      <!-- Left Column: SemVer Explanation -->
      <section class="semver-expl glass-card">
        <h3>Understanding Semantic Versioning</h3>
        <p class="section-desc">We follow the <code>MAJOR.MINOR.PATCH</code> format to govern software releases:</p>
        
        <div class="rules-list">
          <div class="rule-card major">
            <span class="version-label">MAJOR</span>
            <div class="rule-details">
              <h4>Incompatible API changes</h4>
              <p>Incremented when breaking changes are introduced (e.g., v1.0.0 to v2.0.0).</p>
            </div>
          </div>

          <div class="rule-card minor">
            <span class="version-label">MINOR</span>
            <div class="rule-details">
              <h4>Backward-compatible features</h4>
              <p>Incremented when functional enhancements are added (e.g., v1.0.0 to v1.1.0).</p>
            </div>
          </div>

          <div class="rule-card patch">
            <span class="version-label">PATCH</span>
            <div class="rule-details">
              <h4>Backward-compatible bug fixes</h4>
              <p>Incremented when fixing errors or improving performance (e.g., v1.0.0 to v1.0.1).</p>
            </div>
          </div>
        </div>

        <div class="git-tips">
          <h4>💡 Conventional Commits Guideline</h4>
          <p>We trigger automated patch or minor upgrades via commit prefixes in CI/CD pipeline:</p>
          <ul>
            <li><code>fix: ...</code> increments the <strong>patch</strong> version.</li>
            <li><code>feat: ...</code> increments the <strong>minor</strong> version.</li>
            <li><code>feat!: ...</code> or body text <code>BREAKING CHANGE:</code> triggers a <strong>major</strong> release.</li>
          </ul>
        </div>
      </section>

      <!-- Right Column: Visual Release Timeline -->
      <section class="timeline-section glass-card">
        <h3>Release Timeline</h3>
        <p class="section-desc">Historical tracking of published builds</p>

        <div class="timeline">
          <!-- Release 1.0.0 -->
          <div class="timeline-item current">
            <div class="timeline-dot"></div>
            <div class="timeline-content glass-card">
              <div class="release-header">
                <h4>v1.0.0</h4>
                <span class="badge badge-success">Production Release</span>
              </div>
              <p class="release-date">Published: June 3, 2026</p>
              <ul class="release-bulletpoints">
                <li>🎉 **Storefront Rebranding**: Fully customer-friendly platform renamed to **Beliaja.com**.</li>
                <li>🛒 **Shopping Cart Integration**: Add items, adjust quantity limits, and complete checkout.</li>
                <li>📊 **Analytics charts**: Custom SVG line chart plotting sales projections reactively.</li>
                <li>🛡️ **Security scan**: Trivy, Semgrep SAST, and Gitleaks rules added to GitHub Actions.</li>
                <li>🚀 **Docker Image**: Multi-stage lightweight Alpine build with non-root UID 1001.</li>
              </ul>
            </div>
          </div>

          <!-- Release 0.9.0 -->
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content glass-card">
              <div class="release-header">
                <h4>v0.9.0-beta</h4>
                <span class="badge badge-warning">Beta Preview</span>
              </div>
              <p class="release-date">Published: May 28, 2026</p>
              <ul class="release-bulletpoints">
                <li>📦 **Products CRUD**: Catalog management, category select options, SKU inputs.</li>
                <li>⚙️ **Express Server**: Versioned routing REST API v1 (<code>/api/v1/</code>) setup.</li>
                <li>🎨 **Modern Design**: Dark-mode glassmorphic theme and styling tokens added.</li>
              </ul>
            </div>
          </div>

          <!-- Release 0.1.0 -->
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content glass-card">
              <div class="release-header">
                <h4>v0.1.0-alpha</h4>
                <span class="badge badge-info">Initial Alpha</span>
              </div>
              <p class="release-date">Published: May 15, 2026</p>
              <ul class="release-bulletpoints">
                <li>🚀 Initialized workspace folders.</li>
                <li>📝 Basic Express dashboard mock-up endpoint skeleton.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SystemInfo'
};
</script>

<style scoped>
.system-info-view {
  padding-bottom: 40px;
}

.view-header {
  margin-bottom: 32px;
}

.view-header h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 14px;
}

.system-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 32px;
}

.section-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 24px;
}

/* Rules cards */
.rules-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rule-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.rule-card:hover {
  background: rgba(255,255,255,0.04);
}

.version-label {
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  min-width: 75px;
  text-align: center;
}

.rule-card.major .version-label {
  background: rgba(239, 68, 68, 0.15);
  color: var(--color-danger);
  border: 1px solid rgba(239, 68, 68, 0.25);
}

.rule-card.minor .version-label {
  background: rgba(245, 158, 11, 0.15);
  color: var(--color-warning);
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.rule-card.patch .version-label {
  background: rgba(16, 185, 129, 0.15);
  color: var(--color-success);
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.rule-details h4 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 2px;
  color: var(--text-primary);
}

.rule-details p {
  font-size: 12px;
  color: var(--text-secondary);
}

.git-tips {
  margin-top: 32px;
  background: rgba(99, 102, 241, 0.05);
  border: 1px dashed rgba(99, 102, 241, 0.3);
  padding: 20px;
  border-radius: var(--radius-md);
}

.git-tips h4 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.git-tips p {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.git-tips ul {
  padding-left: 20px;
  font-size: 12px;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.git-tips code {
  color: var(--color-primary);
  font-family: var(--font-mono);
}

/* Timeline vertical layout */
.timeline {
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
  padding-left: 24px;
  margin-top: 12px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: var(--border-color);
}

.timeline-item {
  position: relative;
}

.timeline-dot {
  position: absolute;
  left: -24px;
  top: 24px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #334155;
  border: 2px solid var(--bg-primary);
  z-index: 2;
  transition: all 0.3s;
}

.timeline-item.current .timeline-dot {
  background: var(--color-primary);
  box-shadow: 0 0 10px var(--color-primary);
}

.timeline-content {
  padding: 20px;
}

.timeline-content:hover {
  border-color: rgba(99, 102, 241, 0.3);
}

.release-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.release-header h4 {
  font-size: 16px;
  font-weight: 700;
  font-family: var(--font-mono);
}

.release-date {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.release-bulletpoints {
  padding-left: 16px;
  font-size: 12px;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

@media (max-width: 992px) {
  .system-grid {
    grid-template-columns: 1fr;
  }
}
</style>
