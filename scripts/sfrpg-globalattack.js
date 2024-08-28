Hooks.once('ready', async function() {    
    game.settings.register(SfrpgGlobalattack.ID, "bonuses", {
        scope: "world",
      });

    game.settings.registerMenu(SfrpgGlobalattack.ID, "bonusSubMenu", {
        name: "Global attack bonus modifiers",
        label: "Edit global bonuses",
        hint: "Set which global bonuses are available for attack rolls.",
        icon: "fas fa-bars",
        type: SfrpgGlobalattackMenu,
        restricted: true,
        config: false
    });

    SfrpgGlobalattack.setDefaults(CONFIG.SFRPG.globalAttackRollModifiers);
    console.log(SfrpgGlobalattack.ID | 'SFRPG-globalattack active - defaults set');

    if(game.settings.get(SfrpgGlobalattack.ID, 'bonuses')) {
        CONFIG.SFRPG.globalAttackRollModifiers = game.settings.get(SfrpgGlobalattack.ID, 'bonuses');
    }
});


Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
    registerPackageDebugFlag(SfrpgGlobalattack.ID);
}); 

Handlebars.registerHelper('eq', function (a, b) {
    return a === b;
});

class SfrpgGlobalattackMenu extends FormApplication {
    static get defaultOptions() {
        const defaults = super.defaultOptions;

        const overrides = {

            template: SfrpgGlobalattack.TEMPLATES.ATTACKSMENU,
            height: 'auto',
            width: 'auto',
            submitOnChange: true,
            closeOnSubmit: false,
            config: false,
            resizable: true,
            submitOnClose: true
        }

        const mergedOptions = foundry.utils.mergeObject(defaults, overrides);

        return mergedOptions;
    }

    getData(options) {
        return { 
            modifiers: CONFIG.SFRPG.globalAttackRollModifiers,
            types: CONFIG.SFRPG.modifierTypes
        }
    }

    _updateObject(event, formData) {
        let bonuses = [];

        for (let index = 0; index < formData.name.length; index++) {
            let mod = {
                'bonus': {
                    'name': formData.name[index], 
                    'modifier': formData.modifier[index], 
                    'notes': formData.notes[index], 
                    'type': formData.type[index], 
                    'subtab': 'temporary', 
                    'enabled': false, 
                    'modifierType': 'formula'}}
            bonuses.push(mod);
        }

        SfrpgGlobalattack.log(false, "Updating global attack modifiers (formData, bonuses)", formData, bonuses)
        CONFIG.SFRPG.globalAttackRollModifiers = bonuses;
        game.settings.set(SfrpgGlobalattack.ID, 'bonuses', CONFIG.SFRPG.globalAttackRollModifiers)
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.on('click', "[data-action]", this._handleButtonClick.bind(this));
    }

    async _handleButtonClick(event) {
        const clickedElement = $(event.currentTarget);
        const action = clickedElement.data().action;

        switch (action) {
            case 'create': {
                let newBonus = {'bonus': {'name': 'Name', 'modifier': 'Mod', 'notes': 'Notes', 'type': 'untyped', 'enabled': false, 'modifierType': 'formula'}}
                let bonuses = CONFIG.SFRPG.globalAttackRollModifiers;
                bonuses.push(newBonus);
                game.settings.set(SfrpgGlobalattack.ID, 'bonuses', CONFIG.SFRPG.globalAttackRollModifiers)
                break;
            }

            case 'delete': {
                const confirmed = await Dialog.confirm({title: "Confirm Deletion", content: "Are you sure you want to delete the modifier?"})
                if(confirmed) {
                    let index = clickedElement.parents('[data-modifier-index]')?.data().modifierIndex
                    CONFIG.SFRPG.globalAttackRollModifiers.splice(index, 1);
                    game.settings.set(SfrpgGlobalattack.ID, 'bonuses', CONFIG.SFRPG.globalAttackRollModifiers)
                    this.render()
                }
                break;
            }

            case 'defaults': {
                const confirmed = await Dialog.confirm({title: "Confirm Reset", content: "Are you sure you want to set the modifiers back to default?"})
                if(confirmed) {
                    let defaults = SfrpgGlobalattack.getDefaults();
                    CONFIG.SFRPG.globalAttackRollModifiers = defaults;
                    game.settings.set(SfrpgGlobalattack.ID, 'bonuses', defaults)
                }
                break;
            }
        }
        
        return this.render();
    }
}

class SfrpgGlobalattack {
    static ID = 'sfrpg-globalattack';
    static TEMPLATES = {
        ATTACKSMENU : `modules/${this.ID}/templates/sfrpg-globalattack.hbs`,
    }
    DEFAULTS;

    static setDefaults(bonuses) {
        this.DEFAULTS = bonuses;
    }

    static getDefaults() {
        return this.DEFAULTS;
    }
    
    static log(force, ...args) {  
        const shouldLog = force || game.modules.get('_dev-mode')?.api?.getPackageDebugValue(this.ID);

        if (shouldLog) {
            console.log(this.ID, '|', ...args);
        }
    }
}