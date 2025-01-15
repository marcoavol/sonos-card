import { css, html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import MediaControlService from '../services/media-control-service';
import Store from '../model/store';
import { dispatchActivePlayerId, getGroupingChanges } from '../utils/utils';
import { listStyle } from '../constants';
import { MediaPlayer } from '../model/media-player';
import '../components/grouping-button';
import { CardConfig, MediaPlayerEntityFeature, PredefinedGroup, PredefinedGroupPlayer } from '../types';
import { GroupingItem } from '../model/grouping-item';
import { mdiVolumeMinus, mdiVolumePlus, mdiChevronDown, mdiChevronUp } from '@mdi/js';
import HassService from '../services/hass-service';
import { HassEntity } from 'home-assistant-js-websocket';
import { until } from 'lit/directives/until.js';

export class Grouping extends LitElement {
  @property({ attribute: false }) store!: Store;
  private config!: CardConfig;
  private groupingItems!: GroupingItem[];
  private activePlayer!: MediaPlayer;
  private mediaControlService!: MediaControlService;
  private hassService!: HassService;
  private mediaPlayerIds!: string[];
  private notJoinedPlayers!: string[];
  private joinedPlayers!: string[];
  @state() private modifiedItems: string[] = [];
  @state() private selectedPredefinedGroup?: PredefinedGroup;
  @state() private showSwitches: { [entity: string]: boolean } = {};
  @state() private isGroupingInProgress = false;

  render() {
    if (!this.isGroupingInProgress) {
      this.config = this.store.config;
      this.activePlayer = this.store.activePlayer;
      this.mediaControlService = this.store.mediaControlService;
      this.hassService = this.store.hassService;
      this.mediaPlayerIds = this.store.allMediaPlayers.map((player) => player.id);
      this.groupingItems = this.getGroupingItems();
      this.notJoinedPlayers = this.getNotJoinedPlayers();
      this.joinedPlayers = this.getJoinedPlayers();
    }

    const noUpDown = !!this.config.showVolumeUpAndDownButtons && nothing;

    if (this.config.skipApplyButtonWhenGrouping && (this.modifiedItems.length > 0 || this.selectedPredefinedGroup)) {
      this.applyGrouping();
    }

    return html`
      <div class="wrapper">
        <div class="predefined-groups" hide=${!this.store.predefinedGroups.length || nothing}>
          ${this.renderJoinAllButton()} ${this.renderUnJoinAllButton()} ${this.renderPredefinedGroups()}
        </div>
        <div class="list">
          ${this.groupingItems.map((item) => {
            const hideSwitches = !this.showSwitches[item.player.id];
            return html`
              <div class="item-and-switches">
                <div
                  class="item"
                  modified=${item.isModified || nothing}
                  disabled=${item.isDisabled || nothing}
                  selected=${item.isSelected || nothing}
                  grouping-in-progress=${this.isGroupingInProgress || nothing}
                >
                  <ha-icon class="speaker" .icon="mdi:${item.player.attributes.icon || 'speaker'}"></ha-icon>
                  <div class="name-and-volume">
                    <div class="name-and-chevron" @click=${() => this.toggleShowSwitches(item.player)}>
                      <div class="name">${item.name}</div>
                      <ha-icon-button
                        class="chevron"
                        .path="${hideSwitches ? mdiChevronDown : mdiChevronUp}"
                        hide=${this.config.hideSpeakerConfigButton || nothing}
                      ></ha-icon-button>
                    </div>
                    <div class="volume">
                      <ha-icon-button
                        .disabled=${item.player.ignoreVolume}
                        hide=${noUpDown}
                        @click=${() => this.mediaControlService.volumeDown(item.player, false)}
                        .path=${mdiVolumeMinus}
                      ></ha-icon-button>
                      <sonos-volume
                        .store=${this.store}
                        .player=${item.player}
                        .updateMembers=${false}
                        .slim=${true}
                      ></sonos-volume>
                      <ha-icon-button
                        .disabled=${item.player.ignoreVolume}
                        hide=${noUpDown}
                        @click=${() => this.mediaControlService.volumeUp(item.player, false)}
                        .path=${mdiVolumePlus}
                      ></ha-icon-button>
                    </div>
                  </div>
                  <ha-icon-button
                    class="select"
                    .path="${item.icon}"
                    selected=${item.isSelected || nothing}
                    @click=${() => this.toggleItemIfEnabled(item)}
                  ></ha-icon-button>
                </div>
                <div class="switches" hide=${hideSwitches || nothing}>
                  ${when(
                    this.hasAvailableInputSources(item.player),
                    () => html`
                      <sonos-ha-player
                        .store=${this.store}
                        .player=${item.player}
                        .features=${[MediaPlayerEntityFeature.SELECT_SOURCE]}
                      ></sonos-ha-player>
                    `,
                  )}
                  ${until(this.getAdditionalControls(hideSwitches, item.player))}
                </div>
              </div>
            `;
          })}
        </div>
        <ha-control-button-group
          class="buttons"
          hide=${(this.modifiedItems.length === 0 && !this.selectedPredefinedGroup) ||
          this.config.skipApplyButtonWhenGrouping ||
          nothing}
        >
          <ha-control-button class="apply" @click=${this.applyGrouping}> Apply</ha-control-button>
          <ha-control-button @click=${this.cancelGrouping}> Cancel</ha-control-button>
        </ha-control-button-group>
      </div>
    `;
  }

  toggleItemIfEnabled(item: GroupingItem) {
    if (!item.isDisabled) {
      this.toggleItem(item);
    }
  }

  private toggleItem(item: GroupingItem) {
    if (this.modifiedItems.includes(item.player.id)) {
      this.modifiedItems = this.modifiedItems.filter((id) => id !== item.player.id);
    } else {
      this.modifiedItems = [...this.modifiedItems, item.player.id];
    }
    this.selectedPredefinedGroup = undefined;
  }

  async applyGrouping() {
    this.isGroupingInProgress = true;
    try {
      const groupingItems = this.groupingItems;
      const joinedPlayers = this.joinedPlayers;
      const activePlayerId = this.activePlayer.id;
      const { unJoin, join, newMainPlayer } = getGroupingChanges(groupingItems, joinedPlayers, activePlayerId);
      this.modifiedItems = [];
      const selectedPredefinedGroup = this.selectedPredefinedGroup;
      this.selectedPredefinedGroup = undefined;

      if (join.length > 0) {
        await this.mediaControlService.join(activePlayerId, join);
      }
      if (unJoin.length > 0) {
        await this.mediaControlService.unJoin(unJoin);
      }
      if (selectedPredefinedGroup) {
        await this.mediaControlService.setVolumeAndMediaForPredefinedGroup(selectedPredefinedGroup);
      }

      if (newMainPlayer !== activePlayerId && !this.config.dontSwitchPlayerWhenGrouping) {
        dispatchActivePlayerId(newMainPlayer, this.config, this);
      }
      if (this.config.entityId && unJoin.includes(this.config.entityId) && this.config.dontSwitchPlayerWhenGrouping) {
        dispatchActivePlayerId(this.config.entityId, this.config, this);
      }
      // Wait for state updates to propagate
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      this.isGroupingInProgress = false;
      this.requestUpdate();
    }
  }

  private cancelGrouping() {
    this.modifiedItems = [];
  }

  private getGroupingItems() {
    const groupingItems = this.store.allMediaPlayers.map(
      (player) => new GroupingItem(player, this.activePlayer, this.modifiedItems.includes(player.id)),
    );
    const selectedItems = groupingItems.filter((item) => item.isSelected);
    if (selectedItems.length === 1) {
      selectedItems[0].isDisabled = true;
    }
    return groupingItems;
  }

  private renderJoinAllButton() {
    const icon = this.config.groupingButtonIcons?.joinAll ?? 'mdi:checkbox-multiple-marked-outline';
    return when(this.notJoinedPlayers.length, () => this.groupingButton(icon, this.selectAll));
  }

  private groupingButton(icon: string, click: () => void) {
    return html` <sonos-grouping-button @click=${click} .icon=${icon}></sonos-grouping-button> `;
  }

  private getNotJoinedPlayers() {
    return this.mediaPlayerIds.filter(
      (playerId) => playerId !== this.activePlayer.id && !this.activePlayer.hasMember(playerId),
    );
  }

  private renderUnJoinAllButton() {
    const icon = this.config.groupingButtonIcons?.unJoinAll ?? 'mdi:minus-box-multiple-outline';
    return when(this.joinedPlayers.length, () => this.groupingButton(icon, this.deselectAll));
  }

  private getJoinedPlayers() {
    return this.mediaPlayerIds.filter(
      (playerId) => playerId === this.activePlayer.id || this.activePlayer.hasMember(playerId),
    );
  }

  private renderPredefinedGroups() {
    return this.store.predefinedGroups.map((predefinedGroup) => {
      return html`
        <sonos-grouping-button
          @click=${async () => this.selectPredefinedGroup(predefinedGroup)}
          .icon=${this.config.groupingButtonIcons?.predefinedGroup ?? 'mdi:speaker-multiple'}
          .name=${predefinedGroup.name}
          .selected=${this.selectedPredefinedGroup?.name === predefinedGroup.name}
        ></sonos-grouping-button>
      `;
    });
  }

  private selectPredefinedGroup(predefinedGroup: PredefinedGroup<PredefinedGroupPlayer>) {
    this.groupingItems.forEach(async (item) => {
      const inPG = predefinedGroup.entities.some((pgp) => pgp.player.id === item.player.id);
      if ((inPG && !item.isSelected) || (!inPG && item.isSelected)) {
        this.toggleItem(item);
      }
    });
    this.selectedPredefinedGroup = predefinedGroup;
  }

  private selectAll() {
    this.groupingItems.forEach((item) => {
      if (!item.isSelected) {
        this.toggleItemIfEnabled(item);
      }
    });
  }

  private deselectAll() {
    this.groupingItems.forEach((item) => {
      if ((!item.isMain && item.isSelected) || (item.isMain && !item.isSelected)) {
        this.toggleItemIfEnabled(item);
      }
    });
  }

  private toggleShowSwitches(player: MediaPlayer) {
    if (!this.config.hideSpeakerConfigButton) {
      Object.keys(this.showSwitches)
        .filter((key) => key !== player.id)
        .forEach((key) => (this.showSwitches[key] = false));
      this.showSwitches[player.id] = !this.showSwitches[player.id];
      this.requestUpdate();
    }
  }

  private hasAvailableInputSources(player: MediaPlayer) {
    const entity = this.store.hass.states[player.id];
    if (!entity || entity.state === 'unavailable') {
      return false;
    }
    const sourceList = entity.attributes?.source_list;
    return Array.isArray(sourceList) && sourceList.length > 0;
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
    return [
      listStyle,
      css`
        * {
          --mdc-icon-size: 20px;
          --mdc-icon-button-size: 30px;
        }

        .wrapper {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .predefined-groups {
          margin: 1rem;
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          justify-content: center;
          flex-shrink: 0;
        }

        .list {
          flex: 1;
          overflow: auto;
        }

        .item-and-switches {
          display: flex;
          flex-direction: column;
          padding: 0.75rem 0.5rem;
        }

        .item-and-switches:first-child {
          padding-top: 1rem;
        }

        .item-and-switches:not(:first-child) {
          border-top: solid var(--secondary-background-color) !important;
        }

        .item {
          color: var(--secondary-text-color);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .item[selected] sonos-volume {
          --accent-color: unset;
        }

        .item[selected] {
          .select,
          .name {
            color: var(--accent-color);
          }
        }

        .item[disabled] .select {
          opacity: 0.5;
          pointer-events: none;
        }

        .item[grouping-in-progress] .select {
          opacity: 0.5;
          pointer-events: none;
        }

        .name-and-volume {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .name-and-chevron {
          display: flex;
          align-items: center;
          margin-bottom: -3px;
          gap: 3px;
        }

        .name-and-chevron:not(:has(.chevron[hide])) {
          cursor: pointer;
        }

        .name {
          font-weight: bold;
          font-size: 1.1rem;
          text-align: left;
        }

        .volume {
          display: flex;
          align-items: center;

          sonos-volume {
            flex: 1;
            margin: 0 3px;
            --accent-color: var(--secondary-text-color);
            --slider-thickness: 20px;
          }
        }

        .speaker {
          --mdc-icon-size: 3.75rem;
        }

        .select {
          --mdc-icon-size: 2.2rem;
          --mdc-icon-button-size: 3.2rem;
        }

        .switches {
          display: flex;
          justify-content: center;
          flex-direction: column;
          gap: 1rem;
          overflow: hidden;
          padding: 0.5rem 0.5rem 0 0;
          --mdc-theme-primary: var(--primary-color);
          --state-switch-active-color: var(--accent-color) !important;
          --state-binary_sensor-active-color: var(--accent-color) !important;
        }

        .buttons {
          flex-shrink: 0;
          margin: 0 1rem;
          padding-top: 0.5rem;
        }

        .apply {
          --control-button-background-color: var(--accent-color);
        }

        *[hide] {
          display: none;
        }
      `,
    ];
  }
}
