import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import Store from '../model/store';
import { CardConfig, MediaPlayerItem } from '../types';
import { customEvent } from '../utils/utils';
import { MEDIA_ITEM_SELECTED, mediaItemTitleStyle } from '../constants';
import { itemsWithFallbacks, renderMediaBrowserItem } from '../utils/media-browser-utils';

export class MediaBrowserIcons extends LitElement {
  @property({ attribute: false }) store!: Store;
  @property({ attribute: false }) items!: MediaPlayerItem[];
  private config!: CardConfig;

  render() {
    this.config = this.store.config;
    const itemsPerRow = this.config.favoritesItemsPerRow || 4;

    return html`
      <div class="icons" style="--items-per-row: ${itemsPerRow}">
        ${itemsWithFallbacks(this.items, this.config).map(
          (item) => html`
            <ha-control-button @click=${() => this.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED, item))}>
              ${renderMediaBrowserItem(
                item,
                !item.thumbnail || !this.config.favoritesHideTitleForThumbnailIcons,
                this.config.favoritesShowMetadata,
              )}
            </ha-control-button>
          `,
        )}
      </div>
    `;
  }

  static get styles() {
    return [
      mediaItemTitleStyle,
      css`
        .icons {
          display: grid;
          grid-template-columns: repeat(var(--items-per-row, 4), 1fr);
          grid-auto-rows: 1fr;
          gap: 1rem;
        }

        ha-control-button {
          width: 100%;
          height: 100%;
          display: block;
        }

        .thumbnail {
          width: 100%;
          padding-bottom: 100%;
          margin: 0 6%;
          background-size: 100%;
          background-repeat: no-repeat;
          background-position: center;
        }

        .title {
          font-size: 0.8rem;
          position: absolute;
          width: 100%;
          line-height: 160%;
          bottom: 0;
          background-color: rgba(var(--rgb-card-background-color), 0.733);
          padding: 0.25rem;
          box-sizing: border-box;
        }

        .metadata {
          font-size: 0.7rem;
          color: var(--secondary-text-color);
        }

        .content-id,
        .content-type {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `,
    ];
  }
}

customElements.define('sonos-media-browser-icons', MediaBrowserIcons);
