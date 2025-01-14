import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import MediaControlService from '../services/media-control-service';
import Store from '../model/store';
import { CardConfig, MediaPlayerEntityFeature } from '../types';
import { mdiFastForward, mdiRewind, mdiVolumeMinus, mdiVolumePlus } from '@mdi/js';
import { MediaPlayer } from '../model/media-player';
import { until } from 'lit-html/directives/until.js';
import { findPlayer } from '../utils/utils';

const { SHUFFLE_SET, REPEAT_SET, PLAY, PAUSE, NEXT_TRACK, PREVIOUS_TRACK, BROWSE_MEDIA, STOP } =
  MediaPlayerEntityFeature;

class PlayerControls extends LitElement {
  @property({ attribute: false }) store!: Store;
  private config!: CardConfig;
  private activePlayer!: MediaPlayer;
  private mediaControlService!: MediaControlService;
  private volumePlayer!: MediaPlayer;
  private updateMemberVolumes!: boolean;

  render() {
    this.config = this.store.config;
    this.activePlayer = this.store.activePlayer;
    this.mediaControlService = this.store.mediaControlService;
    const noUpDown = !!this.config.showVolumeUpAndDownButtons && nothing;
    const noFastForwardAndRewind = !!this.config.showFastForwardAndRewindButtons && nothing;
    this.volumePlayer = this.getVolumePlayer();
    this.updateMemberVolumes = !this.config.playerVolumeEntityId;
    const pauseOrStop = this.config.stopInsteadOfPause ? STOP : PAUSE;
    return html`
      <div class="main" id="mediaControls">
        <div class="audio-input-format">${this.config.showAudioInputFormat ? until(this.getAudioInputFormat()) : nothing}</div>
        <div class="icons">
              <sonos-ha-player .store=${this.store} .features=${this.showShuffle()}></sonos-ha-player>
              <sonos-ha-player .store=${this.store} .features=${this.showPrev()}></sonos-ha-player>
              <ha-icon-button hide=${noFastForwardAndRewind} @click=${this.rewind} .path=${mdiRewind}></ha-icon-button>
              <sonos-ha-player .store=${this.store} .features=${[PLAY, pauseOrStop]} class="big-icon"></sonos-ha-player>
              <ha-icon-button hide=${noFastForwardAndRewind} @click=${this.fastForward} .path=${mdiFastForward}></ha-icon-button>
              <sonos-ha-player .store=${this.store} .features=${this.showNext()}></sonos-ha-player>
              <sonos-ha-player .store=${this.store} .features=${this.showRepeat()}></sonos-ha-player>
              <sonos-ha-player .store=${this.store} .features=${this.showBrowseMedia()}></sonos-ha-player>
          </div>
          <div class="volume-controls">
            <ha-icon-button hide=${noUpDown} @click=${this.volDown} .path=${mdiVolumeMinus}></ha-icon-button>
            <sonos-volume .store=${this.store} .player=${this.volumePlayer} .slim=${true} .updateMembers=${this.updateMemberVolumes}></sonos-volume>
            <ha-icon-button hide=${noUpDown} @click=${this.volUp} .path=${mdiVolumePlus}></ha-icon-button>
          </div>
          <div class="icons">
            <sonos-ha-player .store=${this.store} .features=${this.store.showPower(true)}></sonos-ha-player>
          </div">
      </div>
  `;
  }

  private getVolumePlayer() {
    let result;
    if (this.config.playerVolumeEntityId) {
      if (this.config.allowPlayerVolumeEntityOutsideOfGroup) {
        result = findPlayer(this.store.allMediaPlayers, this.config.playerVolumeEntityId);
      } else {
        result = this.activePlayer.getMember(this.config.playerVolumeEntityId);
      }
    }
    return result ?? this.activePlayer;
  }

  private volDown = async () => await this.mediaControlService.volumeDown(this.volumePlayer, this.updateMemberVolumes);
  private volUp = async () => await this.mediaControlService.volumeUp(this.volumePlayer, this.updateMemberVolumes);
  private rewind = async () =>
    await this.mediaControlService.seek(
      this.activePlayer,
      this.activePlayer.attributes.media_position - (this.config.fastForwardAndRewindStepSizeSeconds || 15),
    );
  private fastForward = async () =>
    await this.mediaControlService.seek(
      this.activePlayer,
      this.activePlayer.attributes.media_position + (this.config.fastForwardAndRewindStepSizeSeconds || 15),
    );

  private async getAudioInputFormat() {
    const sensors = await this.store.hassService.getRelatedEntities(this.activePlayer, 'sensor');
    const audioInputFormat = sensors.find((sensor) => sensor.entity_id.toLowerCase().includes('audio'));
    return audioInputFormat &&
      audioInputFormat.state &&
      audioInputFormat.state !== 'No audio' &&
      !audioInputFormat.state.toLowerCase().includes('unknown')
      ? html`<div>${audioInputFormat.state}</div>`
      : nothing;
  }

  private showShuffle() {
    return this.config.hidePlayerControlShuffleButton ? [] : [SHUFFLE_SET];
  }

  private showPrev() {
    return this.config.hidePlayerControlPrevTrackButton ? [] : [PREVIOUS_TRACK];
  }

  private showNext() {
    return this.config.hidePlayerControlNextTrackButton ? [] : [NEXT_TRACK];
  }

  private showRepeat() {
    return this.config.hidePlayerControlRepeatButton ? [] : [REPEAT_SET];
  }

  private showBrowseMedia() {
    return this.config.showBrowseMediaInPlayerSection ? [BROWSE_MEDIA] : [];
  }

  static get styles() {
    return css`
      .main {
        overflow: hidden auto;
      }

      .icons {
        justify-content: center;
        display: flex;
        align-items: center;
      }

      .audio-input-format {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;

        > div {
          max-width: 100%;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
          font-size: smaller;
          line-height: normal;
        }
      }

      .volume-controls {
        display: flex;
        align-items: center;
        justify-content: space-evenly;
        sonos-volume {
          flex-grow: 1;
        }
      }

      *[hide] {
        display: none;
      }

      .big-icon {
        --mdc-icon-button-size: 5rem;
        --mdc-icon-size: 5rem;
      }
    `;
  }
}

customElements.define('sonos-player-controls', PlayerControls);
