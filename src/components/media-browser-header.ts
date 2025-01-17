import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { MediaPlayerEntityFeature, MediaBrowserHeaderButtonConfig } from '../types';
import Store from '../model/store';
import { ActionConfig, handleAction } from 'custom-card-helpers';

class MediaBrowserHeader extends LitElement {
  @property({ attribute: false }) store!: Store;

  render() {
    const buttonConfigs: MediaBrowserHeaderButtonConfig[] = this.store.config.mediaBrowserHeaderButtons || [];
    return html`
      <div class="buttons">
        ${buttonConfigs.map(
          (button) => html`
            <ha-control-button
              class="button ${!button.tap_action || button.tap_action.action === 'none' ? 'text-only' : ''}"
              @mouseup=${() => this._handleAction(button.tap_action)}
              @touchend=${() => this._handleAction(button.tap_action)}
            >
              ${button.icon ? html`<ha-icon .icon=${button.icon}></ha-icon>` : nothing} ${button.text}
            </ha-control-button>
          `,
        )}
        <sonos-ha-player
          hide=${this.store.config.hideBrowseMediaButton || nothing}
          .store=${this.store}
          .features=${[MediaPlayerEntityFeature.BROWSE_MEDIA]}
        ></sonos-ha-player>
      </div>
    `;
  }

  private _handleAction(tapAction?: ActionConfig): void {
    if (tapAction) {
      handleAction(this, this.store.hass, { tap_action: tapAction }, 'tap');
    }
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .buttons {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .button {
        display: flex;
        align-items: center;
        flex-grow: 1;
        width: auto;
        height: 36px;
        padding: 0;
        white-space: nowrap;
        font-family: var(
          --mdc-typography-button-font-family,
          var(--mdc-typography-font-family, Roboto, sans-serif)
        ) !important;
        font-size: var(--mdc-typography-button-font-size, 0.875rem) !important;
        font-weight: var(--mdc-typography-button-font-weight, 500) !important;
        letter-spacing: var(--mdc-typography-button-letter-spacing, 0.0892857143em) !important;
        --control-button-padding: 0 8px;
        --control-button-background-color: unset;
        --control-button-border-radius: 4px;
        --control-button-icon-color: var(--secondary-text-color);

        ha-icon {
          margin-right: 6px;
        }
      }

      .button.text-only {
        pointer-events: none;
        touch-action: none;
      }

      *[hide] {
        display: none;
      }
    `;
  }
}

customElements.define('sonos-media-browser-header', MediaBrowserHeader);
