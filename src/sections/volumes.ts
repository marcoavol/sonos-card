import { css, html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import Store from '../model/store';
import { CardConfig, MediaPlayerEntityFeature } from '../types';
import { until } from 'lit-html/directives/until.js';
import { when } from 'lit/directives/when.js';
import { mdiCog, mdiVolumeMinus, mdiVolumePlus } from '@mdi/js';
import MediaControlService from '../services/media-control-service';
import { MediaPlayer } from '../model/media-player';
import HassService from '../services/hass-service';
import { HassEntity } from 'home-assistant-js-websocket';
import '../components/sleep-timer';

const { SELECT_SOURCE } = MediaPlayerEntityFeature;

export class Volumes extends LitElement {
  @property({ attribute: false }) store!: Store;
  private config!: CardConfig;
  private activePlayer!: MediaPlayer;
  private mediaControlService!: MediaControlService;
  @state() private showSwitches: { [entity: string]: boolean } = {};
  private hassService!: HassService;

  render() {
    this.config = this.store.config;
    this.activePlayer = this.store.activePlayer;
    this.hassService = this.store.hassService;
    this.mediaControlService = this.store.mediaControlService;

    const members = this.activePlayer.members;
    return html`
      ${when(members.length > 1, () => this.volumeWithName(this.activePlayer))}
      ${members.map((member) => this.volumeWithName(member, false))}
    `;
  }

  private volumeWithName(player: MediaPlayer, updateMembers = true) {
    const name = updateMembers ? (this.config.labelForTheAllVolumesSlider ?? 'All') : player.name;
    const volDown = async () => await this.mediaControlService.volumeDown(player, updateMembers);
    const volUp = async () => await this.mediaControlService.volumeUp(player, updateMembers);
    const noUpDown = !!this.config.showVolumeUpAndDownButtons && nothing;
    const hideSwitches = updateMembers || !this.showSwitches[player.id];
    return html` <div class="name-and-volume">
      <div class="name">
        <div class="name-text">${name}</div>
      </div>
      <div class="volume">
        <ha-icon-button
          .disabled=${player.ignoreVolume}
          hide=${noUpDown}
          @click=${volDown}
          .path=${mdiVolumeMinus}
        ></ha-icon-button>
        <sonos-volume
          .store=${this.store}
          .player=${player}
          .updateMembers=${updateMembers}
          .slim=${true}
        ></sonos-volume>
        <ha-icon-button
          .disabled=${player.ignoreVolume}
          hide=${noUpDown}
          @click=${volUp}
          .path=${mdiVolumePlus}
        ></ha-icon-button>
        <ha-icon-button
          hide=${updateMembers || this.config.hideVolumeCogwheel || nothing}
          @click=${() => this.toggleShowSwitches(player)}
          .path=${mdiCog}
          show-switches=${this.showSwitches[player.id] || nothing}
        ></ha-icon-button>
      </div>
      <div class="switches" hide=${hideSwitches || nothing}>
        <sonos-ha-player .store=${this.store} .features=${[SELECT_SOURCE]}> </sonos-ha-player>
        ${until(this.getAdditionalControls(hideSwitches, player))}
      </div>
    </div>`;
  }

  private toggleShowSwitches(player: MediaPlayer) {
    this.showSwitches[player.id] = !this.showSwitches[player.id];
    this.requestUpdate();
  }

  private async getAdditionalControls(hide: boolean, player: MediaPlayer) {
    if (hide) {
      return;
    }
    const relatedEntities = await this.hassService.getRelatedEntities(player, 'switch', 'number', 'sensor');
    const controls = relatedEntities.map((relatedEntity: HassEntity) => {
      relatedEntity.attributes.friendly_name =
        relatedEntity.attributes.friendly_name?.replaceAll(player.name, '')?.trim() ?? '';
      return html`
        <div>
          <state-card-content .stateObj=${relatedEntity} .hass=${this.store.hass}></state-card-content>
        </div>
      `;
    });
    controls.push(html`<sonos-sleep-timer .store=${this.store} .player=${player}></sonos-sleep-timer>`);
    return controls;
  }

  static get styles() {
    return css`
      .name-and-volume {
        display: flex;
        flex-direction: column;
        padding: 0.5rem 1rem;
      }

      .name-and-volume:first-child {
        padding-top: 1rem;
      }

      .name-and-volume:not(:first-child) {
        border-top: solid var(--secondary-background-color);
      }

      .switches {
        display: flex;
        justify-content: center;
        flex-direction: column;
        gap: 1rem;
        overflow: hidden;
        padding: 0 0.5rem 0.5rem 0;
      }

      .name {
        flex: 1;
        overflow: hidden;
        flex-direction: column;
        text-align: center;
      }

      .name-text {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 1.1rem;
        font-weight: bold;
        min-height: 1rem;
      }

      .volume {
        display: flex;
        align-items: center;
      }

      sonos-volume {
        flex: 4;
      }

      *[show-switches] {
        color: var(--accent-color);
      }

      *[hide] {
        display: none;
      }
    `;
  }
}
