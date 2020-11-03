class FateUtilities extends Application{
    constructor(){
        super();
        game.system.apps["actor"].push(this);
        game.system.apps["combat"].push(this);
        game.system.apps["scene"].push(this); //Maybe? If we want to store scene notes, aspects, etc.
        game.system.apps["user"].push(this);
        this.category="All";
        this.editing = false;
        if (game.system.tokenAvatar == undefined){
            game.system.tokenAvatar = true;
        }
    }

    close(){
        game.system.apps["actor"].splice(game.system.apps["actor"].indexOf(this),1); 
        game.system.apps["combat"].splice(game.system.apps["combat"].indexOf(this),1); 
        game.system.apps["scene"].splice(game.system.apps["scene"].indexOf(this),1); 
        game.system.apps["user"].splice(game.system.apps["user"].indexOf(this),1); 
        super.close();
    }

    activateListeners(html) {
        super.activateListeners(html);
        const input = html.find('input[type="text"], input[type="number"], textarea');
        input.on("focus", event => {
            if (this.editing == false) {
                this.editing = true;
            }
        });
        input.on("blur", event => {
            this.editing = false; 
            if (this.renderBanked){
                this.renderBanked = false;
                this.render(false);
            }
        });

        const popcornButtons = html.find("button[class='popcorn']");
        popcornButtons.on("click", event => this._onPopcornButton(event, html));
        const nextButton = html.find("button[id='next_exchange']");
        nextButton.on("click", event => this._nextButton(event, html));
        const endButton = html.find("button[id='end_conflict']");
        endButton.on("click", event => this._endButton(event, html));
        const timed_event = html.find("button[id='timed_event']");
        timed_event.on("click", event => this._timed_event(event, html));
        const category_select = html.find("select[id='category_select']")
        category_select.on("change", event => {
                this.category = category_select[0].value;
                this.render(false);
        })
        const track_name = html.find("div[name='track_name']");
        const box = html.find("input[name='box']");
        box.on("click", event => this._on_click_box(event, html));
        track_name.on("click", event => this._on_track_name_click(event, html));
        const track_aspect = html.find("input[name='track_aspect']");
        track_aspect.on("change", event => this._on_aspect_change(event, html));

        const roll = html.find("button[name='roll']");
        roll.on("click", event => this._roll(event,html));

        const clear_fleeting = html.find("button[id='clear_fleeting']");
        clear_fleeting.on("click", event => this._clear_fleeting(event,html));

        const add_sit_aspect = html.find("button[id='add_sit_aspect']")
        add_sit_aspect.on("click", event => this._add_sit_aspect(event, html));

        //Situation Aspect Buttons
        const del_sit_aspect = html.find("button[name='del_sit_aspect']");
        del_sit_aspect.on("click", event => this._del_sit_aspect(event, html));

        const addToScene = html.find("button[name='addToScene']");
        addToScene.on("click", event => this._addToScene(event, html));

        const panToAspect = html.find("button[name='panToAspect']");
        panToAspect.on("click", event => this._panToAspect(event, html));

        const free_i = html.find("input[name='free_i']");
        free_i.on("change", event => this._free_i_button(event, html));

        const scene_notes = html.find("div[id='scene_notes']");
        scene_notes.on("focus", event => this.scene_notes_edit(event, html));
        scene_notes.on("blur", event => this._notesFocusOut(event,html));

        const gmfp = html.find("input[name='gmfp']");
        gmfp.on("change", event=> this._edit_gm_points(event, html));

        const playerfp = html.find("input[name='player_fps']");
        playerfp.on("change", event=> this._edit_player_points(event, html));

        const refresh_fate_points = html.find("button[id='refresh_fate_points']");
        refresh_fate_points.on("click", event => this.refresh_fate_points(event, html));    

        const avatar = html.find("img[name='avatar']");
        avatar.on("click", event=> this._on_avatar_click(event,html));

        const fu_clear_rolls = html.find("button[id='fu_clear_rolls']");
        fu_clear_rolls.on("click", event => this._fu_clear_rolls(event, html));

        const fu_roll_button = html.find("button[name='fu_roll_button']");
        fu_roll_button.on("click",event => this._fu_roll_button(event, html));

        const select = html.find("select[class='skill_select']");
        select.on("focus", event => {
            this.selectingSkill = true;
        });

        select.on("click", event => {if (event.shiftKey) {this.shift = true}})
        select.on("change", event => this._selectRoll (event, html));

        select.on("blur", event => {
            this.selectingSkill = false;
            this.render(false);
        })
    }

    async _selectRoll (event, html){
        let t_id = event.target.id.split("_")[0]
        let token = canvas.tokens.placeables.find(t => t.id==t_id);
        
        let sk = html.find(`select[id='${t_id}_selectSkill']`)[0];
        let skill;
        let stunt = undefined;
        let bonus=0;

        if (sk.value.startsWith("stunt")){
            let items = sk.value.split("_");
            stunt=items[1]
            skill = items[2]
            bonus = parseInt(items[3]);
        } else {
            skill = sk.value.split("(")[0].trim();
        }
        let rank = token.actor.data.data.skills[skill].rank;
        let ladder = ModularFateConstants.getFateLadder();
        let rankS = rank.toString();
        let rung = ladder[rankS];

        if (this.shift && !sk.value.startsWith("stunt")) {
                let mrd = new ModifiedRollDialog (token.actor, skill);
                mrd.render(true);
                this.shift=false;
        } else {
            let r;
            if (bonus >0){
                r = new Roll(`4dF + ${rank}+${bonus}`);    
            } else {
                r = new Roll(`4dF + ${rank}`);
            }
                let roll = r.roll();
                let name = game.user.name

                let flavour;
                if (stunt != undefined){
                    flavour = `<h1>${skill}</h1>Rolled by: ${game.user.name}<br>
                                Skill rank: ${rank} (${rung})<br> 
                                Stunt: ${stunt} (+${bonus})`
                } else {
                    flavour = `<h1>${skill}</h1>Rolled by: ${game.user.name}<br>
                                Skill rank: ${rank} (${rung})`;
                }

                roll.toMessage({
                    flavor: flavour,
                    speaker: ChatMessage.getSpeaker(token),
                });
        }
        this.selectingSkill = false;
        this.render(false);
    }

    async _notesFocusOut(event, html){
        let notes = html.find("div[id='scene_notes']")[0].innerHTML
        game.scenes.viewed.setFlag("ModularFate","sceneNotes",notes);
        this.editing=false;
    }

    async _fu_roll_button(event, html){
        let detail = event.target.id.split("_");
        let index = detail[1];
        let action = detail[2];
        let rolls = duplicate(game.scenes.viewed.getFlag("ModularFate","rolls"));
        let roll = rolls[index]
        
        if (action == "plus1"){
            roll.total+=1;
            roll.flavor+=`<br>Added Bonus: +1`
            if (game.user.isGM){
                game.scenes.viewed.setFlag("ModularFate", "rolls", rolls);
            } else {
                //Create a socket call to update the scene's roll data
                game.socket.emit("system.ModularFate",{"rolls":rolls, "scene":game.scenes.viewed})
            }
        }

        if (action == "plus2free"){
            roll.total+=2;
            roll.flavor+=`<br>Free Invoke: +2`
            if (game.user.isGM){ 
                game.scenes.viewed.setFlag("ModularFate", "rolls", rolls);
            }
            else {
                //Create a socket call to update the scene's roll data
                game.socket.emit("system.ModularFate",{"rolls":rolls, "scene":game.scenes.viewed})
            }
        }

        if (action == "reroll"){
            let r = new Roll ("4dF");
            let r2 = r.roll();
            let oldDiceValue = 0;
            for (let i = 0; i< 4; i++){
                oldDiceValue += roll.dice[i]
            }
            roll.total -= oldDiceValue;
            roll.dice = r2.dice[0].values;
            if (roll.dice == undefined){
                let d = r2.dice[0].rolls;
                roll.dice = [];
                for (let i=0; i< d.length; i++){
                    roll.dice.push(d[i].roll)
                }
            }
            roll.total += r2.total;
            roll.flavor+=`<br>Free Invoke: Reroll`
            if (game.user.isGM){
                game.scenes.viewed.setFlag("ModularFate", "rolls", rolls);
            } else {
                //Create a socket call to update the scene's roll data
                game.socket.emit("system.ModularFate",{"rolls":rolls, "scene":game.scenes.viewed})
            }
        }

        if (action == "plus2fp"){
            //Find the right character and deduct one from their fate points
            let user = game.users.entries.find(user => user.id == roll.user._id)

            if (user.isGM){
                let fps = user.getFlag("ModularFate","gmfatepoints");
                if (fps == 0 || fps == undefined){
                    ui.notifications.error("No GM fate points available for an invoke")
                } else {
                    user.setFlag("ModularFate","gmfatepoints",fps-1);
                    roll.total+=2;
                    roll.flavor+=`<br>Paid Invoke: +2`
                    game.scenes.viewed.setFlag("ModularFate", "rolls", rolls);
                }
            } else {
                let char = user.character;
                if (char.name == roll.speaker){
                    let fps = char.data.data.details.fatePoints.current;
                    if (fps == 0){
                        ui.notifications.error("No fate points available for an invoke")
                    } else {
                        char.update({"data.details.fatePoints.current":fps-1})
                        roll.total+=2;
                        roll.flavor+=`<br>Paid Invoke: +2`
                        if (game.user.isGM){
                            game.scenes.viewed.setFlag("ModularFate", "rolls", rolls);
                        } else {
                            game.socket.emit("system.ModularFate",{"rolls":rolls, "scene":game.scenes.viewed})
                        }
                    }
                } else {
                    ui.notifications.error("You're not currently controlling that character")
                }
            }
        }

        if (action == "rerollfp"){
            //Find the right character and deduct one from their fate points
            let user = game.users.entries.find(user => user.id == roll.user._id)

            if (user.isGM){
                let fps = user.getFlag("ModularFate","gmfatepoints");
                if (fps == 0 || fps == undefined){
                    ui.notifications.error("No GM fate points available for an invoke")
                } else {
                    user.setFlag("ModularFate","gmfatepoints",fps-1);
                    let r = new Roll ("4dF");
                    let r2 = r.roll();
                    let oldDiceValue = 0;
                    for (let i = 0; i< 4; i++){
                        oldDiceValue += roll.dice[i]
                    }
                    roll.total -= oldDiceValue;
                    roll.dice = r2.dice[0].values;
                    if (roll.dice == undefined){
                        let d = r2.dice[0].rolls;
                        roll.dice = [];
                        for (let i=0; i< d.length; i++){
                            roll.dice.push(d[i].roll)
                        }
                    }
                    roll.total += r2.total;
                    roll.flavor+=`<br>Paid Invoke: Reroll`
                    game.scenes.viewed.setFlag("ModularFate", "rolls", rolls);
                }
            } else {
                let char = user.character;
                if (char.name == roll.speaker){
                    let fps = char.data.data.details.fatePoints.current;
                    if (fps == 0){
                        ui.notifications.error("No fate points available for an invoke")
                    } else {
                        char.update({"data.details.fatePoints.current":fps-1})
                        roll.flavor+=`<br>Paid Invoke: Reroll`
                        let r = new Roll ("4dF");
                        let r2 = r.roll();
                        let oldDiceValue = 0;
                        for (let i = 0; i< 4; i++){
                            oldDiceValue += roll.dice[i]
                        }
                        roll.total -= oldDiceValue;
                        roll.dice = r2.dice[0].values;
                        roll.total += r2.total;
                        if (game.user.isGM){
                            game.scenes.viewed.setFlag("ModularFate", "rolls", rolls);
                        } else {
                            game.socket.emit("system.ModularFate",{"rolls":rolls, "scene":game.scenes.viewed})
                        }
                    }
                } else {
                    ui.notifications.error("You're not currently controlling that character")
                }
            }
        }
    }

    async _fu_clear_rolls(event,html){
        game.scenes.viewed.unsetFlag("ModularFate","rolls");
    }

    async _on_avatar_click(event, html){
        if (game.user.isGM){
            let fu_actor_avatars = game.settings.get("ModularFate","fu_actor_avatars");
            let t_id = event.target.id.split("_")[0];
            let token = canvas.tokens.placeables.find(t => t.id == t_id);
            if (!fu_actor_avatars){
                ui.notifications.info("Switching to actor avatars");
                await game.settings.set("ModularFate","fu_actor_avatars",true);
            } else {
                if (fu_actor_avatars){
                    ui.notifications.info("Switching to token avatars");
                    await game.settings.set("ModularFate","fu_actor_avatars",false);
                }
            }
            this.render(false);
            game.socket.emit("system.ModularFate",{"render":true});
        }
    }

    async refresh_fate_points(event, html){
        let tokens = canvas.tokens.placeables;
        let updates = [];
        for (let i = 0; i < tokens.length; i++){
            let token = tokens[i];
            if (token.actor == null || !token.actor.hasPlayerOwner){
                continue;
            }
            let current = parseInt(token.actor.data.data.details.fatePoints.current);
            let refresh = parseInt(token.actor.data.data.details.fatePoints.refresh);

            if (current < refresh){
                current = refresh;
            }
            updates.push({"_id":token.actor.id,"data.details.fatePoints.current":current})
        }
        Actor.update(updates);
    }

    async _edit_player_points(event, html){
        let id = event.target.id;
        let parts = id.split("_");
        let t_id = parts[0]
        let token = canvas.tokens.placeables.find(t => t.id==t_id);
        let fps = parseInt(event.target.value);

        token.actor.update({
            ["data.details.fatePoints.current"]: fps
        })
    }

    async _edit_gm_points(event, html){
        let user = game.users.entries.find(user => user.id == event.target.id);
        let fp = parseInt(event.target.value)
        user.setFlag("ModularFate","gmfatepoints",fp);
    }

    async scene_notes_edit(event,html){
        this.editing = true;
    }

    async _free_i_button(event,html){
        let name=event.target.id.split("_")[0];
        let value=html.find(`input[id="${name}_free_invokes"]`)[0].value
        let situation_aspects = duplicate(game.scenes.viewed.getFlag("ModularFate","situation_aspects"))
        let aspect = situation_aspects[situation_aspects.findIndex(sit => sit.name == name)];
        aspect.free_invokes = value;
        game.scenes.viewed.setFlag("ModularFate","situation_aspects",situation_aspects);
        //ToDo: Add code to change number of free invokes showing on the scene note for this aspect, if it exists.
        let drawing = canvas.drawings.objects.children.find(drawing => drawing.data.text.startsWith(name));
        if (drawing != undefined){
            let text;
            if (value == 1){
                text = name+" ("+value + " free invoke)";    
            } else {
                text = name+" ("+value + " free invokes)";
            }
            drawing.update({
                "text":text,
                width: text.length*20,
                fontFamily: "Modesto Condensed",
            });
        }
    }

    async _panToAspect(event, html){
        let name=event.target.id.split("_")[1];
        let drawing = canvas.drawings.objects.children.find(drawing => drawing.data.text.startsWith(name));
        
        if (drawing != undefined) {
            let x = drawing.data.x;
            let y = drawing.data.y;
            canvas.animatePan({x:x, y:y});
        }
    }

    async _addToScene(event, html){
        let name=event.target.id.split("_")[1];
        let value=html.find(`input[id="${name}_free_invokes"]`)[0].value;

        if (canvas.drawings.objects.children.find(drawing => drawing.data.text.startsWith(name))==undefined)
        {
            let text;
            if (value == 1){
                text = name+" ("+value + " free invoke)";    
            } else {
                text = name+" ("+value + " free invokes)";
            }

                Drawing.create({
                    type: CONST.DRAWING_TYPES.RECTANGLE,
                    author: game.user._id,
                    x: canvas.stage.pivot._x,
                    y: canvas.stage.pivot._y,
                    width: text.length*20,
                    height: 75,
                    fillType: CONST.DRAWING_FILL_TYPES.SOLID,
                    fillColor: "#FFFFFF",
                    fillAlpha: 1,
                    strokeWidth: 4,
                    strokeColor: "#000000",
                    strokeAlpha: 1,
                    text: text,
                    fontFamily: "Modesto Condensed",
                    fontSize: 48,
                    textColor: "#000000",
                    points: []
                });   
        }
        else {
            ui.notifications.error("There's already a note for that aspect");
        }
    }

    async _del_sit_aspect(event, html){
        let del =   ModularFateConstants.confirmDeletion();
        if (del){
            let id = event.target.id;
            name = id.split("_")[1];
            let situation_aspects = duplicate(game.scenes.viewed.getFlag("ModularFate", "situation_aspects"));
            situation_aspects.splice(situation_aspects.findIndex(sit => sit.name == name),1);
            game.scenes.viewed.setFlag("ModularFate","situation_aspects",situation_aspects);
        
            //If there's a note on the scene for this aspect, delete it
            let drawing = canvas.drawings.objects.children.find(drawing => drawing.data.text.startsWith(name));
            if (drawing != undefined){
                drawing.delete();
            }
        }
    }

    async _add_sit_aspect(event, html){
        const sit_aspect = html.find("input[id='sit_aspect']");
        let situation_aspects = [];
        let situation_aspect = {
                                    "name":sit_aspect[0].value,
                                    "free_invokes":0
                                };
        try {
            situation_aspects = duplicate(game.scenes.viewed.getFlag("ModularFate","situation_aspects"));
        } catch {
        }                                
        situation_aspects.push(situation_aspect);
        game.scenes.viewed.setFlag("ModularFate","situation_aspects",situation_aspects);
    }

    async _saveNotes(event, html){
        this.editing=false;
    }

    async _clear_fleeting(event, html){
        let tokens = canvas.tokens.placeables;
        for (let i = 0; i<tokens.length; i++){
            this.clearFleeting(tokens[i].actor)
        }
    }

    async _on_aspect_change(event, html){
        let id = event.target.id;
        let parts = id.split("_");
        let t_id = parts[0];
        let name = parts[1];
        let text = event.target.value;
        let token = canvas.tokens.placeables.find(t => t.id==t_id);
        let tracks = duplicate(token.actor.data.data.tracks);
        let track = tracks[name]
        track.aspect.name=text;
        token.actor.update({[`data.tracks.${name}.aspect`]:track.aspect})
    }

    async _on_click_box(event, html) {
        let id = event.target.id;
        let parts = id.split("_");
        let name = parts[0]
        let index = parts[1]
        let checked = parts[2]
        let t_id = parts[3]
        index = parseInt(index)
        if (checked == "true") {
            checked = true
        }
        if (checked == "false") {
            checked = false
        }
        let token = canvas.tokens.placeables.find(t => t.id==t_id);
        let tracks = duplicate(token.actor.data.data.tracks);
        let track = tracks[name]
        track.box_values[index] = checked;
        token.actor.update({
            ["data.tracks"]: tracks
        })
    }


    async _on_track_name_click(event, html) {
        // Launch a simple application that returns us some nicely formatted text.
        //First, get the token
        let token_id = event.target.id;
        let token = canvas.tokens.placeables.find(t => t.id==token_id);
        let tracks = duplicate(token.actor.data.data.tracks);
        let track = tracks[event.target.innerHTML]
        let notes = track.notes;
        let text =   ModularFateConstants.updateText("Track Notes", notes);
        token.actor.update({
            [`data.tracks.${event.target.innerHTML}.notes`]: text
        })
    }

    async _timed_event (event, html){
        let te = new TimedEvent();
        te.createTimedEvent();
    }

    async _onPopcornButton(event, html){
        let t_id = event.target.id;
        let token = canvas.tokens.placeables.find(token => token.id == t_id)
        await token.setFlag("ModularFate","hasActed", true);
    }

    async _endButton(event, html){
        let actors = game.combat.combatants;
        let fin = await Promise.resolve(game.combat.endCombat());
        if (fin != false){
            let updates = actors.map(actor => {
                                let update = {};
                                update._id = actor.token._id;
                                update.flags = {
                                                    "ModularFate":
                                                    {
                                                        "hasActed":false
                                                    }
                                                }        
                                        return update;
                                })
            game.scenes.viewed.updateEmbeddedEntity("Token", updates);
        }
    }

    async _nextButton(event, html){
        let actors = game.combat.combatants;
            let updates = actors.map(actor => {
                            let update = {};
                            update._id = actor.token._id;
                            update.flags = {
                                                "ModularFate":
                                                {
                                                    "hasActed":false
                                                }
                                            }        
                                    return update;
                            })
        game.scenes.viewed.updateEmbeddedEntity("Token", updates);
        game.combat.nextRound();
    }

    //Set up the default options for instances of this class
    static get defaultOptions() {
        const options = super.defaultOptions; //begin with the super's default options
        //The HTML file used to render this window
        options.template = "systems/ModularFate/templates/FateUtilities.html"; 
        options.width="1000"
        options.height="auto";
        options.title = `Fate Utilities`;
        options.id = "FateUtilities"; // CSS id if you want to override default behaviors
        options.resizable = true;
        options.scrollY=["#fu_aspects_tab","#fu_tracks_tab", "#fu_scene_tab", "#fu_rolls_tab", "#fu_aspects_pane", "#fu_scene_notes_pane"]

        mergeObject(options, {
            tabs: [
                {
                    navSelector: '.foo',
                    contentSelector: '.utilities-body',
                    initial: 'aspects',
                },
            ],
        });
        return options;
    }

async getData(){
    //Let's prepare the data for the initiative tracker here
    const data =   super.getData();
    if (game.combat==null){
        data.conflict = false;
    } else {
        data.conflict = true;

        //Let's build a list of the tokens from canvas.tokens.placeables and feed them to the presentation layer
        let c = game.combat.combatants;
        let tokens = [];
        let has_acted = [];
        let tokenId = undefined;
        c.forEach(comb => {
                tokenId= comb.token._id;
                let foundToken = undefined;
                let hidden = false;
                let hasActed = false;

                if (tokenId != undefined){
                    foundToken = canvas.tokens.placeables.find(val => {return val.id == tokenId;})
                }
                if ((comb.hidden || foundToken.data.hidden) && !game.user.isGM){
                    hidden = true;
                } else {
                }
                if (foundToken != undefined){
                    //There is no token for this actor in the conflict; it probably means the token has been deleted from the scene. We need to ignore this actor. Easiest way to do that is to leave hasActed as true.
                        hasActed = foundToken.getFlag("ModularFate","hasActed");                       
                    } else {
                        hidden = true;
                    }

                    if ((hasActed == undefined || hasActed == false) && hidden == false){
                        tokens.push(foundToken)
                    }
                    else {
                        if (hasActed == true && hidden == false){
                            has_acted.push(foundToken);
                        }
                    }
        })
        data.has_acted_tokens = has_acted;
        data.combat_tokens=tokens;
        data.exchange = game.combat.round;   
    }
    let all_tokens = [];
    let notes = game.scenes.viewed.getFlag("ModularFate","sceneNotes");
    if (notes == undefined){
        notes = ""
    }
    data.notes = notes;
    canvas.tokens.placeables.forEach(token => {
        if (token.actor != null && (token.data.hidden == false || game.user.isGM)){
            all_tokens.push(token)
        } 
    })

    let situation_aspects = game.scenes.viewed.getFlag("ModularFate","situation_aspects")
    if (situation_aspects == undefined){
        situation_aspects = [];
    }
    situation_aspects = duplicate(situation_aspects);
    
    data.situation_aspects = situation_aspects;

    data.all_tokens = all_tokens;
    data.GM=game.user.isGM;
    
    let GMUsers={};
    game.users.entries.forEach(user => {
        if (user.isGM){
            GMUsers[user.name]=user;
            GMUsers[user.name]["fatepoints"]=user.getFlag("ModularFate","gmfatepoints")
        }
    })
    data.GMUsers = GMUsers;

    data.category=this.category;
    let categories = new Set();
    for (let token of all_tokens){
        for (let t in token.actor.data.data.tracks){
            categories.add(token.actor.data.data.tracks[t].category);
        }
    }
    data.categories = Array.from(categories);
    data.tokenAvatar = !game.settings.get("ModularFate","fu_actor_avatars");

    //Let's get the list of Fate rolls made
    let rolls = game.scenes.viewed.getFlag("ModularFate","rolls");
    if (rolls == undefined){
        rolls = [];
    }
    data.rolls = rolls;
    data.user = game.user;
    return data;
}

async render (...args){
    if (this.editing == false && (this.selectingSkill == false || this.selectingSkill == undefined)){
          super.render(...args);
    } else {
        this.renderBanked = true;
    }
}

async renderMe(...args){
    //Code to execute when a hook is detected by ModularFate. Will need to tackle hooks for Actor
    //Scene, and Combat.
    //The following code debounces the render, preventing multiple renders when multiple simultaneous update requests are received.
    if (!this.renderPending) {
        this.renderPending = true;
        setTimeout(() => {
          this.render(false);
          this.renderPending = false;
        }, 0);
      }
}

async clearFleeting(object){
    this.object = object;

        //This is a convenience method which clears all fleeting Tracks.
        let tracks = duplicate(this.object.data.data.tracks);
        
        for (let t in tracks){
            let track = tracks[t];
            if (track.recovery_type == "Fleeting"){
                for (let i = 0; i < track.box_values.length; i++){
                    track.box_values[i] = false;
                }
                if (track.aspect.name != undefined){
                    track.aspect.name = "";
                }
            }
        }
        this.object.update({
            ["data.tracks"]: tracks
        })
    }
}

Hooks.on('getSceneControlButtons', function(hudButtons)
{
    let hud = hudButtons.find(val => {return val.name == "token";})
            if (hud){
                hud.tools.push({
                    name:"FateUtilities",//Completed
                    title:"Launch Fate Utilities",
                    icon:"fas fa-theater-masks",
                    onClick: ()=> {let fu = new FateUtilities; fu.render(true)},
                    button:true
                });
            }
})

class TimedEvent extends Application {

    constructor(){
        super();
    }

    createTimedEvent(){
        var triggerRound=0;
        var triggerText="";
        var currentRound="NoCombat";
        try {
            currentRound = game.combat.round;
        } catch {
            var dp = {
                "title": "Error",
                "content": "There's no current combat for which to set an event.<p>",
                default:"oops",
                "buttons": {
                    oops: {
                        label: "OK",
                    }
                }
            }
            let d = new Dialog(dp);
            d.render(true);
        }
        if (currentRound != "NoCombat"){
            var peText = "No Pending Events<p></p>"
            let pendingEvents = game.combat.getFlag("ModularFate","timedEvents");
            if (pendingEvents != null || pendingEvents != undefined){
                peText=
                `<tr>
                    <td style="font-weight:bold">Round</td>
                    <td style="font-weight:bold">Pending Event</td>
                </tr>`
                pendingEvents.forEach(event => {
                    if (event.complete === false){
                        peText+=`<tr><td>${event.round}</td><td>${event.event}</td></tr>`
                    }
                });
            }
            var dp = {
                "title":"Timed Event",
                "content":`<h1>Create a Timed Event</h1>
                            The current exchange is ${game.combat.round}.<p></p>
                            <table style="background:none; border:none">
                                ${peText}
                            </table>
                            <table style="background:none; border:none">
                                <tr>
                                    <td>What is your event?</td>
                                    <td><input type="text" id="eventToCreate" name="eventToCreate" style="background: white; color: black;" autofocus></input></td>
                                </tr>
                                <tr>
                                    <td>Trigger event on exchange:</td>
                                    <td><input type="number" value="${game.combat.round+1}" id="eventExchange" name="eventExchange"></input></td>
                                </tr>
                            </table>`,
                    default:"create",
                    "buttons":{
                        create:{label:"Create", callback:async () => {
                            //if no flags currently set, initialise
                            var timedEvents = game.combat.getFlag("ModularFate","timedEvents");
                            
                            if (timedEvents ==null || timedEvents == undefined){
                                game.combat.setFlag("ModularFate","timedEvents",[
                                                                                        {   "round":`${document.getElementById("eventExchange").value}`,
                                                                                            "event":`${document.getElementById("eventToCreate").value}`,
                                                                                            "complete":false
                                                                                        }
                                                                                ])
                                                                                timedEvents=game.combat.getFlag("ModularFate","timedEvents");
                            } else {
                                timedEvents.push({   
                                                    "round":`${document.getElementById("eventExchange").value}`,
                                                    "event":`${document.getElementById("eventToCreate").value}`,
                                                    "complete":false
                                });
                                game.combat.setFlag("ModularFate","timedEvents",timedEvents);
                                
                                }

                            triggerRound=document.getElementById("eventExchange").value;
                            triggerText=document.getElementById("eventToCreate").value;
                        }}
                    }
                }
            let dO = Dialog.defaultOptions;
            dO.width="auto";
            dO.height="auto";
            dO.resizable="true"
            let d = new Dialog(dp, dO);
            d.render(true);
        }
    }
}

Hooks.on('renderCombatTracker', () => {
    try {
        var r = game.combat.round;
        let pendingEvents = game.combat.getFlag("ModularFate","timedEvents");
        for (let i = 0; i<pendingEvents.length;i++){
            var event = pendingEvents[i];
            if (r==event.round && event.complete != true){
                var dp = {
                    "title": "Timed Event",
                    "content": `<h2>Timed event for round ${event.round}:</h2><p></p>
                                <h3>${event.event}</h3>`,
                    default:"oops",
                    "buttons": {
                        oops: {
                            label: "OK",
                        }
                    }
                }
                event.complete = true;
                let d = new Dialog(dp);
                d.render(true);
            }
        }
    }catch {

    }
})

Hooks.on('createChatMessage', (message) => {
    if (message.data.roll != undefined){
        let roll = JSON.parse(message.data.roll)
        if (roll.formula.startsWith("4df") || roll.formula.startsWith("4dF")){
            //We're not interested in it unless it's a Fate roll.
            //If it is, we want to add this to the array of rolls in the scene's flags.
            let speaker = message.data.speaker.alias;
            let flavor = message.data.flavor;
            let formula = roll.formula;
            let total = roll.total;
            let dice ="";
            let diceResult = message.roll.dice[0].values;
            if (diceResult == undefined){
                let d = message.roll.dice[0].rolls;
                diceResult = [];
                for (let i=0; i< d.length; i++){
                    diceResult.push(d[i].roll)
                }
            }
            let user = message.user;
            let rolls = game.scenes.viewed.getFlag("ModularFate","rolls");
            if (rolls == undefined){
                rolls = [];
            }
            rolls=duplicate(rolls);
            
            let mFRoll = {
                "speaker":speaker,
                "formula":formula,
                "flavor":flavor,
                "total":total,
                "dice":diceResult,
                "user":user
            }
            rolls.push(mFRoll);

            if (game.user.isGM){
                game.scenes.viewed.setFlag("ModularFate","rolls",rolls);           
            }
        }
    }
})

Hooks.once('ready', async function () {
    if (game.user.isGM){
        game.socket.on("system.ModularFate", rolls => {
            updateRolls(rolls);
        })
    }

    game.socket.on("system.ModularFate", render => {
        if (render.render){
            let FU = Object.values(ui.windows).find(window=>window.options.id=="FateUtilities");
            if (FU != undefined){
                FU.render(false);
            }
        }
    })
})

async function updateRolls (rolls) {
    if (rolls.rolls != undefined) {
        let scene = game.scenes.entries.find(sc=> sc.id==rolls.scene._id);
        let currRolls = scene.getFlag("ModularFate","rolls");
        if (currRolls == undefined){
            currRolls = [];
        }
        currRolls = duplicate(currRolls);
        let endRolls = mergeObject(currRolls, rolls.rolls);
        scene.setFlag("ModularFate","rolls",endRolls);
    }
}

Hooks.on('renderFateUtilities', function(){
    let numAspects = document.getElementsByName("sit_aspect").length;
    if (numAspects == undefined){
        numAspects = 0;
    }
    if (game.system.sit_aspects == undefined){
        game.system.sit_aspects = numAspects;
    }
    
    if (numAspects > game.system.sit_aspects){
        let pane = document.getElementById("fu_aspects_pane")
        pane.scrollTop=pane.scrollHeight;
        game.system.sit_aspects = numAspects;
    }
    
    if (numAspects < game.system.sit_aspects){
        game.system.sit_aspects = numAspects;
    }

    let numRolls = document.getElementsByName("fu_roll").length;
    if (numRolls == undefined){
        numRolls = 0;
    }
    if (game.system.num_rolls == undefined){
        game.system.num_rolls = numRolls;
    }
    
    if (numRolls > game.system.num_rolls){
        let pane = document.getElementById("fu_rolls_tab")
        pane.scrollTop=pane.scrollHeight;
        game.system.num_rolls = numRolls;
    }
    
    if (numRolls < game.system.num_rolls){
        game.system.num_rolls = numRolls;
    }
})
