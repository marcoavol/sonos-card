import { css, html, LitElement, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import Store from '../model/store';
import { MediaPlayer } from '../model/media-player';
import { mdiCheckCircle, mdiCloseCircle } from '@mdi/js';

export class SleepTimer extends LitElement {
  @property({ attribute: false }) store!: Store;
  @property({ attribute: false }) player!: MediaPlayer;
  @query('#sleepTimerInput') private sleepTimer!: HTMLInputElement;
  @state() private sleepTimerActive = false;

  render() {
    if (this.player.attributes.platform !== 'sonos') {
      return nothing;
    }
    return html`
      <div id="sleepTimer">
        <ha-icon id="sleepTimerClock" .icon=${'mdi:bed-clock'} class=${this.sleepTimerActive ? 'active' : ''}></ha-icon>
        <label for="sleepTimer">Sleep Timer (min)</label>
        <input type="number" id="sleepTimerInput" min="0" max="720" value="15" />
        <ha-icon-button id="sleepTimerSubmit" .path=${mdiCheckCircle} @click=${this.setSleepTimer}></ha-icon-button>
        <ha-icon-button id="sleepTimerCancel" .path=${mdiCloseCircle} @click=${this.cancelSleepTimer}></ha-icon-button>
      </div>
    `;
  }

  private setSleepTimer() {
    const hassService = this.store.hassService;
    hassService.setSleepTimer(this.player, this.sleepTimer.valueAsNumber);
    this.sleepTimerActive = true;
  }

  private cancelSleepTimer() {
    const hassService = this.store.hassService;
    hassService.cancelSleepTimer(this.player);
    this.sleepTimerActive = false;
  }

  static get styles() {
    return css`
      #sleepTimer {
        display: flex;
        align-items: center;
        gap: 7px;
        color: var(--primary-text-color);
      }

      #sleepTimer > label {
        align-content: center;
        flex: 2;
      }

      #sleepTimerClock {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        color: var(--paper-item-icon-color);

        &.active {
          color: var(--accent-color);
        }
      }

      #sleepTimerInput {
        padding: 5px;
      }

      #sleepTimerSubmit {
        color: var(--accent-color);
      }

      #sleepTimerCancel {
        color: var(--secondary-text-color);
      }
    `;
  }
}

customElements.define('sonos-sleep-timer', SleepTimer);
