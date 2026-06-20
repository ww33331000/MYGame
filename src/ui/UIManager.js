export class UIManager {
    constructor(game) {
        this.game = game;
        this.currentPanel = null;
        this.notificationTimer = 0;
        this.notificationText = '';
    }

    updateMenuButtons() {
        const hasSave = localStorage.getItem('mount_and_blade_clone_save_slot_0');
        const continueBtn = document.getElementById('btn-continue');
        if (continueBtn) {
            if (hasSave) {
                continueBtn.classList.remove('hidden');
            } else {
                continueBtn.classList.add('hidden');
            }
        }
    }

    showScreen(screenId) {
        document.getElementById(screenId)?.classList.remove('hidden');
    }

    hideScreen(screenId) {
        document.getElementById(screenId)?.classList.add('hidden');
    }

    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
    }

    showHUD() {
        document.getElementById('hud')?.classList.remove('hidden');
    }

    hideHUD() {
        document.getElementById('hud')?.classList.add('hidden');
    }

    updateHUD() {
        if (!this.game.player) return;

        document.getElementById('hud-player-name').textContent = this.game.player.name;
        document.getElementById('hud-level').textContent = this.game.player.level;
        document.getElementById('hud-gold').textContent = this.game.player.gold;
        document.getElementById('hud-date').textContent = `第${this.game.day}天`;
    }

    showPanel(tab) {
        this.hideAllPanels();

        switch (tab) {
            case 'party':
                document.getElementById('party-panel')?.classList.remove('hidden');
                this.updatePartyPanel();
                break;
            case 'equipment':
                document.getElementById('inventory-panel')?.classList.remove('hidden');
                this.updateInventoryPanel();
                break;
            case 'skills':
                this.showSkillsPanel();
                break;
            case 'quests':
                document.getElementById('quest-panel')?.classList.remove('hidden');
                this.updateQuestPanel();
                break;
            case 'world':
                this.game.showWorldMap();
                break;
        }

        this.currentPanel = tab;
    }

    hideAllPanels() {
        document.querySelectorAll('.panel').forEach(panel => {
            panel.classList.add('hidden');
        });
    }

    updatePartyPanel() {
        if (!this.game.party) return;

        document.getElementById('party-count').textContent = this.game.party.getTotalCount();
        document.getElementById('party-max').textContent = this.game.party.maxSize;
        document.getElementById('party-strength').textContent = Math.floor(this.game.party.getTotalStrength());

        const troopList = document.getElementById('troop-list');
        if (troopList) {
            troopList.innerHTML = '';

            for (const troop of this.game.party.troops) {
                const div = document.createElement('div');
                div.className = 'troop-item';
                div.innerHTML = `
                    <span>${troop.data?.name || troop.type}</span>
                    <span>x${troop.count}</span>
                `;
                troopList.appendChild(div);
            }

            if (this.game.party.troops.length === 0) {
                troopList.innerHTML = '<p style="color: var(--text-dim); text-align: center;">暂无士兵</p>';
            }
        }
    }

    updateInventoryPanel() {
        const inventoryGrid = document.getElementById('inventory-grid');
        if (!inventoryGrid) return;

        inventoryGrid.innerHTML = '';

        const equipmentSlots = document.querySelectorAll('.equip-slot');
        equipmentSlots.forEach(slot => {
            const slotName = slot.dataset.slot;
            const equipped = this.game.player.equipment[slotName];

            slot.innerHTML = `<span>${this.getSlotName(slotName)}</span>`;
            if (equipped) {
                slot.style.backgroundColor = 'var(--accent)';
                slot.style.color = 'var(--bg-dark)';
            }
        });

        for (let i = 0; i < 20; i++) {
            const slotDiv = document.createElement('div');
            slotDiv.className = 'inventory-slot';

            if (this.game.player.inventory[i]) {
                slotDiv.classList.add('filled');
                const item = this.game.player.inventory[i];
                slotDiv.title = `${item.name} - ${item.price}G`;
            }

            inventoryGrid.appendChild(slotDiv);
        }
    }

    getSlotName(slot) {
        const names = {
            head: '头部',
            chest: '躯干',
            legs: '腿部',
            arms: '手臂',
            weapon: '武器',
            shield: '盾牌',
            mount: '坐骑'
        };
        return names[slot] || slot;
    }

    showSkillsPanel() {
        const skills = this.game.player.skills;
        let skillText = '=== 技能 ===\n';
        for (const skill in skills) {
            skillText += `${skill}: ${skills[skill]}\n`;
        }
        alert(skillText);
    }

    updateQuestPanel() {
        const questList = document.getElementById('quest-list');
        if (!questList || !this.game.quests) return;

        questList.innerHTML = '';

        const activeQuests = this.game.quests.getActiveQuests();

        if (activeQuests.length === 0) {
            questList.innerHTML = '<p style="color: var(--text-dim); text-align: center;">暂无进行中的任务</p>';
            return;
        }

        for (const quest of activeQuests) {
            const div = document.createElement('div');
            div.className = 'quest-item';
            div.innerHTML = `
                <h4>${quest.name}</h4>
                <p>${quest.description}</p>
                <p class="reward">奖励: ${quest.rewards.gold}G / ${quest.rewards.exp}EXP</p>
            `;
            questList.appendChild(div);
        }
    }

    showLocationInfo(location) {
        const panel = document.getElementById('location-panel');
        if (!panel) return;

        document.getElementById('loc-name').textContent = location.name;
        document.getElementById('loc-type').textContent = `类型: ${this.getLocationTypeName(location.type)}`;
        document.getElementById('loc-owner').textContent = `统治者: ${location.owner}`;
        document.getElementById('loc-troops').textContent = `驻军: ${location.troops}`;

        panel.classList.remove('hidden');

        const tradeBtn = document.getElementById('btn-trade');
        const recruitBtn = document.getElementById('btn-recruit');
        const talkBtn = document.getElementById('btn-talk');

        tradeBtn.onclick = () => this.handleTrade(location);
        recruitBtn.onclick = () => this.handleRecruit(location);
        talkBtn.onclick = () => this.handleTalk(location);
    }

    getLocationTypeName(type) {
        const names = {
            town: '城镇',
            castle: '城堡',
            village: '村庄'
        };
        return names[type] || type;
    }

    handleTrade(location) {
        if (location.type !== 'town') {
            this.showNotification('这里没有市场');
            return;
        }
        this.showNotification(`进入 ${location.name} 的市场`);
    }

    handleRecruit(location) {
        if (!location.barracks && location.type !== 'town') {
            this.showNotification('这里没有兵营');
            return;
        }
        this.showRecruitMenu(location);
    }

    showRecruitMenu(location) {
        const troops = this.game.data.troops;
        let menuText = '=== 招募士兵 ===\n';
        for (const type in troops) {
            const troop = troops[type];
            menuText += `${troop.name}: ${troop.cost}G (战力: ${troop.strength})\n`;
        }
        menuText += '\n输入兵种名称招募:';

        const input = prompt(menuText);
        if (input) {
            const type = Object.keys(troops).find(t =>
                troops[t].name.includes(input) || t.includes(input.toLowerCase())
            );
            if (type) {
                const success = this.game.party.recruit(type, this.game.data);
                if (success) {
                    this.showNotification(`成功招募 ${troops[type].name}`);
                    this.updatePartyPanel();
                    this.updateHUD();
                } else {
                    this.showNotification('招募失败: 金币不足或队伍已满');
                }
            }
        }
    }

    handleTalk(location) {
        const faction = this.game.data.getFaction(location.owner);
        const lordName = this.getRandomLordName();

        this.showNotification(`${faction?.name || '当地'}的${lordName}: 欢迎来到${location.name}`);
    }

    getRandomLordName() {
        const names = ['领主奥斯里克', '男爵威廉', '爵士理查德', '伯爵亨利的', '公爵罗伯特'];
        return names[Math.floor(Math.random() * names.length)];
    }

    showPauseMenu() {
        document.getElementById('pause-menu')?.classList.remove('hidden');
    }

    hidePauseMenu() {
        document.getElementById('pause-menu')?.classList.add('hidden');
    }

    showSettings() {
        alert('设置面板 (待实现)');
    }

    showNotification(text) {
        this.notificationText = text;
        this.notificationTimer = 3000;

        let notif = document.getElementById('notification');
        if (!notif) {
            notif = document.createElement('div');
            notif.id = 'notification';
            notif.style.cssText = `
                position: fixed;
                top: 80px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(42, 31, 26, 0.95);
                border: 3px solid var(--accent);
                padding: 15px 30px;
                color: var(--text);
                font-family: var(--font-pixel);
                z-index: 300;
                pointer-events: none;
            `;
            document.body.appendChild(notif);
        }

        notif.textContent = text;
        notif.style.opacity = '1';

        setTimeout(() => {
            notif.style.opacity = '0';
            setTimeout(() => {
                notif.style.opacity = '1';
            }, 200);
        }, this.notificationTimer);
    }
}
