import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { MediaPlayerEntityFeature } from '../types';
import Store from '../model/store';

class MediaBrowserHeader extends LitElement {
  @property({ attribute: false }) store!: Store;

  render() {
    return html`
      <div class="title ${this.store.config.hideBrowseMediaButton ? 'center' : ''}">
        ${this.store.config.mediaBrowserTitle ?? 'All Favorites'}
      </div>
      <sonos-ha-player
        hide=${this.store.config.hideBrowseMediaButton || nothing}
        .store=${this.store}
        .features=${[MediaPlayerEntityFeature.BROWSE_MEDIA]}
      ></sonos-ha-player>
    `;
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        justify-content: space-between;
      }
      .title {
        font-size: 1.1rem;
        font-weight: bold;
        display: flex;
        align-items: center;
        padding: 0.5rem;
      }
      .title.center {
        width: 100%;
        justify-content: center;
      }
      *[hide] {
        display: none;
      }
    `;
  }
}

customElements.define('sonos-media-browser-header', MediaBrowserHeader);
