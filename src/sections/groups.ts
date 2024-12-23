import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import '../components/group';
import Store from '../model/store';
import { listStyle } from '../constants';

export class Groups extends LitElement {
  @property({ attribute: false }) store!: Store;
  @property({ attribute: false }) activePlayerId!: string;

  render() {
    this.activePlayerId = this.store.activePlayer.id;

    return html`
      <mwc-list activatable class="list">
        ${this.store.allGroups
          .sort((a, b) => {
            if (a.id === this.activePlayerId) return -1;
            if (b.id === this.activePlayerId) return 1;
            if (a.isPlaying()) return -1;
            if (b.isPlaying()) return 1;
            return 0;
          })
          .map((group) => html` <sonos-group .store=${this.store} .player=${group}></sonos-group> `)}
      </mwc-list>
    `;
  }
  static get styles() {
    return listStyle;
  }
}
