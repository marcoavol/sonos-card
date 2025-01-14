import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { CardConfig, Section } from '../types';
import './section-button';
import { isSonosCard } from '../utils/utils';

class Footer extends LitElement {
  @property({ attribute: false }) config!: CardConfig;
  @property() section!: Section;

  render() {
    const icons = this.config.sectionButtonIcons;
    let sections: [Section, string][] = [
      [Section.PLAYER, icons?.player ?? 'mdi:home'],
      [Section.MEDIA_BROWSER, icons?.mediaBrowser ?? 'mdi:star-outline'],
      [Section.GROUPS, icons?.groups ?? 'mdi:speaker-multiple'],
      [Section.GROUPING, icons?.grouping ?? 'mdi:checkbox-multiple-marked-outline'],
      [Section.QUEUE, icons?.queue ?? 'mdi:queue-first-in-last-out'],
      [Section.VOLUMES, icons?.volumes ?? 'mdi:tune'],
    ];
    if (!isSonosCard(this.config)) {
      sections = sections.filter(([section]) => section !== Section.QUEUE);
    }
    sections = sections.filter(([section]) => !this.config.sections || this.config.sections?.includes(section));
    return html`
      ${sections.map(
        ([section, icon]) => html`
          <sonos-section-button
            .config=${this.config}
            .icon=${icon}
            .selectedSection=${this.section}
            .section=${section}
          ></sonos-section-button>
        `,
      )}
    `;
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        justify-content: space-around;
      }
      :host > * {
        align-content: center;
      }
    `;
  }
}

customElements.define('sonos-footer', Footer);
