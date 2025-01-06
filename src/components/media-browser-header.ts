import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { MediaPlayerEntityFeature } from '../types';
import Store from '../model/store';
import { handleAction } from 'custom-card-helpers';

class MediaBrowserHeader extends LitElement {
  @property({ attribute: false }) store!: Store;

  render() {
    const titleButtonConfig = this.store.config.mediaBrowserTitleButton;
    return html`
      ${titleButtonConfig
        ? html`
            <ha-control-button
              class="title ${this.store.config.hideBrowseMediaButton ? 'center' : ''} ${!titleButtonConfig.tap_action ||
              titleButtonConfig.tap_action.action === 'none'
                ? 'text-only'
                : ''}"
              @mouseup=${this._handleAction}
              @touchend=${this._handleAction}
            >
              ${titleButtonConfig.icon ? html`<ha-icon .icon=${titleButtonConfig.icon}></ha-icon>` : nothing}
              ${titleButtonConfig.text || 'Favorites'}
            </ha-control-button>
          `
        : nothing}
      <sonos-ha-player
        hide=${this.store.config.hideBrowseMediaButton || nothing}
        .store=${this.store}
        .features=${[MediaPlayerEntityFeature.BROWSE_MEDIA]}
      ></sonos-ha-player>
    `;
  }

  private _handleAction(e: UIEvent): void {
    e.preventDefault();
    const titleButtonConfig = this.store.config.mediaBrowserTitleButton;
    if (titleButtonConfig?.tap_action) {
      handleAction(this, this.store.hass, { tap_action: titleButtonConfig.tap_action }, 'tap');
    }
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .title {
        display: flex;
        align-items: center;
        width: auto;
        font-size: 1.1rem;
        font-weight: bold;
        padding: 0;
        --control-button-background-color: unset;
        --control-button-border-radius: 4px;
        --control-button-icon-color: var(--secondary-text-color);
        ha-icon {
          margin-right: 6px;
        }
      }

      .title.center {
        width: 100%;
        justify-content: center;
      }

      .title.text-only {
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
