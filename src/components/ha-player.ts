import { LitElement, html } from 'lit';
import { property } from 'lit/decorators.js';
import Store from '../model/store';
import { MediaPlayerEntityFeature } from '../types';
import { MediaPlayer } from '../model/media-player';

export class HaPlayer extends LitElement {
  @property({ attribute: false }) store!: Store;
  @property({ attribute: false }) features!: MediaPlayerEntityFeature[];
  @property({ attribute: false }) player?: MediaPlayer;

  render() {
    const state = this.store.hass.states[this.player?.id || this.store.activePlayer.id];
    let supportedFeatures = 0;
    this.features.forEach((feature) => (supportedFeatures += feature));

    const playerState = {
      ...state,
      attributes: { ...state.attributes, supported_features: supportedFeatures },
    };

    return html`<more-info-content .stateObj=${playerState} .hass=${this.store.hass}></more-info-content> `;
  }
}

customElements.define('sonos-ha-player', HaPlayer);
