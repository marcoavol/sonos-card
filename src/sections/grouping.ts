import { css, html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import MediaControlService from '../services/media-control-service';
import Store from '../model/store';
import { dispatchActivePlayerId, getGroupingChanges } from '../utils/utils';
import { listStyle } from '../constants';
import { MediaPlayer } from '../model/media-player';
import '../components/grouping-button';
import { CardConfig, PredefinedGroup, PredefinedGroupPlayer } from '../types';
import { GroupingItem } from '../model/grouping-item';
import { mdiVolumeMinus, mdiVolumePlus } from '@mdi/js';

export class Grouping extends LitElement {
  @property({ attribute: false }) store!: Store;
  private config!: CardConfig;
  private groupingItems!: GroupingItem[];
  private activePlayer!: MediaPlayer;
  private mediaControlService!: MediaControlService;
  private mediaPlayerIds!: string[];
  private notJoinedPlayers!: string[];
  private joinedPlayers!: string[];
  @state() modifiedItems: string[] = [];
  @state() selectedPredefinedGroup?: PredefinedGroup;
  @state() private isGroupingInProgress = false;

  render() {
    if (!this.isGroupingInProgress) {
      this.config = this.store.config;
      this.activePlayer = this.store.activePlayer;
      this.mediaControlService = this.store.mediaControlService;
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
            return html`
              <div
                class="item"
                modified=${item.isModified || nothing}
                disabled=${item.isDisabled || nothing}
                selected=${item.isSelected || nothing}
                grouping-in-progress=${this.isGroupingInProgress || nothing}
              >
                <div class="name">${item.name}</div>
                <div class="volume-and-select">
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
                  <ha-icon
                    class="select"
                    selected=${item.isSelected || nothing}
                    .icon="mdi:${item.icon}"
                    @click=${() => this.toggleItemIfEnabled(item)}
                  ></ha-icon>
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

  static get styles() {
    return [
      listStyle,
      css`
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

        .item {
          color: var(--secondary-text-color);
          display: flex;
          flex-direction: column;
          padding: 0.5rem 1rem;
        }

        .item:first-child {
          padding-top: 1rem;
        }

        .item:not(:first-child) {
          border-top: solid var(--secondary-background-color) !important;
        }

        .item[disabled] .select {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .item[grouping-in-progress] .select {
          cursor: not-allowed;
        }

        .item[selected] .name {
          color: var(--accent-color);
        }

        .item[selected] sonos-volume {
          --accent-color: unset !important;
        }

        .name {
          width: 100%;
          text-align: center;
          font-weight: bold;
          font-size: 1.1rem;
        }

        .volume-and-select {
          display: flex;
          align-items: center;
        }

        .volume {
          flex: 1;
          display: flex;
          align-items: center;
        }

        sonos-volume {
          flex: 1;
          --accent-color: var(--secondary-text-color);
        }

        .select {
          padding: 0.5rem;
          flex-shrink: 0;
          cursor: pointer;
        }

        .select[selected] {
          color: var(--accent-color);
        }

        .list {
          flex: 1;
          overflow: auto;
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
