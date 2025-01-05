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
        ${this.store.allGroups.map(
          (group) => html` <sonos-group .store=${this.store} .player=${group}></sonos-group> `,
        )}
      </mwc-list>
    `;
  }
  static get styles() {
    return listStyle;
  }
}
