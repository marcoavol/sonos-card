import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import Store from '../model/store';
import { customEvent, dispatchActivePlayerId, getSpeakerList } from '../utils/utils';
import { MediaPlayer } from '../model/media-player';
import { SHOW_SECTION } from '../constants';
import { Section } from '../types';

class Group extends LitElement {
  @property({ attribute: false }) store!: Store;
  @property({ attribute: false }) player!: MediaPlayer;
  @property({ attribute: false }) selected = false;

  dispatchEntityIdEvent = () => {
    if (this.selected) {
      const entityId = this.player.id;
      dispatchActivePlayerId(entityId, this.store.config, this);
    }
  };

  render() {
    this.selected = this.store.activePlayer.id === this.player.id;
    const currentTrack = this.store.config.hideGroupCurrentTrack
      ? ''
      : this.player.getCurrentTrack() || this.store.config.labelWhenNoMediaIsSelected;
    const speakerList = getSpeakerList(this.player, this.store.predefinedGroups);
    return html`
      <mwc-list-item
        hasMeta
        ?selected=${this.selected}
        ?activated=${this.selected}
        @click=${() => this.handleGroupClicked()}
      >
        <div class="row">
          <ha-icon .icon=${this.player.members.length > 1 ? 'mdi:speaker-multiple' : 'mdi:speaker'}></ha-icon>
          <div class="text">
            <span class="speakers">${speakerList}</span>
            <span class="song-title">${currentTrack}</span>
          </div>
        </div>

        ${when(
          this.player.isPlaying(),
          () => html`
            <div class="bars" slot="meta">
              <div></div>
              <div></div>
              <div></div>
            </div>
          `,
        )}
      </mwc-list-item>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    this.dispatchEntityIdEvent();
  }

  private handleGroupClicked() {
    if (this.selected) {
      this.dispatchEvent(customEvent(SHOW_SECTION, Section.GROUPING));
    } else {
      this.selected = true;
      this.dispatchEntityIdEvent();
    }
  }

  static get styles() {
    return css`
      @keyframes sound {
        0% {
          opacity: 0.35;
          height: 0.15rem;
        }
        100% {
          opacity: 1;
          height: 1rem;
        }
      }

      mwc-list-item {
        height: fit-content;
        margin: 1rem;
        border-radius: 1rem;
        background: var(--secondary-background-color);
        padding-left: 0;
        --mdc-ripple-color: transparent;

        .row {
          margin: 0.85rem 0;
        }
      }

      mwc-list-item:hover {
        --mdc-ripple-color: var(--secondary-text-color);
      }

      mwc-list-item:active {
        --mdc-ripple-color: var(--secondary-text-color);
      }

      mwc-list-item[selected],
      mwc-list-item[activated] {
        --mdc-ripple-color: var(--accent-color);
        .speakers {
          color: var(--accent-color);
        }
      }

      .row {
        display: flex;
        margin: 1rem 0;
        align-items: center;
      }

      .text {
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .speakers {
        white-space: initial;
        font-size: 1.1rem;
        font-weight: bold;
        color: var(--secondary-text-color);
      }

      .song-title {
        font-size: 0.9rem;
        color: var(--secondary-text-color);
      }

      ha-icon {
        --mdc-icon-size: 3rem;
        color: var(--secondary-text-color);
        text-align: center;
        padding: 0 0.5rem;
      }

      .bars {
        width: 0.55rem;
        position: relative;
        margin-left: 1rem;
      }

      .bars > div {
        background: var(--secondary-text-color);
        bottom: 0.05rem;
        height: 0.15rem;
        position: absolute;
        width: 0.15rem;
        animation: sound 0ms -800ms linear infinite alternate;
        display: block;
      }

      .bars > div:first-child {
        left: 0.05rem;
        animation-duration: 474ms;
      }

      .bars > div:nth-child(2) {
        left: 0.25rem;
        animation-duration: 433ms;
      }

      .bars > div:last-child {
        left: 0.45rem;
        animation-duration: 407ms;
      }
    `;
  }
}

customElements.define('sonos-group', Group);
