let DP = {};


let budgetUpdate = () => {DP.ActiveJump.UpdateBudgets(DP.ActiveJumperID)};


function setUpTextArea (tx){
    tx.style.height = 0; 
    tx.style.height = (tx.scrollHeight + 15) + "px";
    let onInput = () => { 
        tx.style.height = 0; 
        tx.style.height = (tx.scrollHeight + 15) + "px";};
    tx.addEventListener("input", onInput, false);
}

function toggleHighlighting(child){
    for (let element = child; element; element = element.parentElement) {
        if (element.classList.contains("highlightable")) {
            element.classList.toggle("highlighted");
            break;
        }
    }

}

function loremIpsum (){
    return "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum";
}

function displayHeight (height){
    let imperialUnits = localStorage.getItem("unitsImperial") == "true";
    if (!imperialUnits) return `${height}`;
    let feet = Math.floor(height / 12);
    let inches = height - feet * 12;
    return `${feet}\u00A0ft ${inches}`;
}

function displayAge (age){
    let descriptor = "Years";
    if (age > 5000) {
        descriptor = "Centuries";
        age = Math.floor(age / 100);
        if (age > 500) {
            age = Math.floor(age / 10);
            descriptor = "Millenia";
        }
    }
    return `${age} ${descriptor}`;
}


function E (type, attr = {}, ...children) {
    let el = document.createElement(type);
    for (let n in attr) {
        if (n == 'style') {
            for (let s in attr[n])
            el.style[s] = attr[n][s];
        }
        else {
            el.setAttribute(n, attr[n]);
        }
    }
    for (child of children) {
        el.appendChild(child);
    }
    return el;
}

function T (text) {
    return document.createTextNode(text);

}

function doAccordian(button, expand = -1){
    if (expand < 0) {
        button.classList.toggle('expand');button.classList.toggle('collapse');
    } else {
        if (expand) {
            button.classList.remove('expand');button.classList.add('collapse');
        } else {
            button.classList.add('expand');button.classList.remove('collapse');
        }
    }
    for (let element = button; element; element = element.parentElement) {
        if (element.classList.contains("collapsable")) {
            if (expand < 0) {
                element.classList.toggle("collapsed");
            } else {
                if (expand) {
                    element.classList.remove("collapsed");
                } else {
                    element.classList.add("collapsed");
                }
            }
            break;
        }
    }
}

function createIconButton(type, modifiers = "", params = {}){
    let button = E("a", {
        href: "#;", 
        class: `icon button ${modifiers} ${type}`
    });

    switch(type){
        case "save":
            button.setAttribute("title", "Save");
            button.addEventListener("click", 
                ()=>{
                    toggleHighlighting(button);
                    saveForm(params.InputList, params.Item, params.FieldList,
                    () => {
                        params.Form.replaceWith(
                            params.Callback(params.Item, params.Form.querySelector(".persistent > .expand") == null))}
                    );}, 
            false);
            break;
        case "edit":
            button.setAttribute("title", "Edit");
            button.addEventListener("click", ()=>{
                toggleHighlighting(button);
                swapInInputs(
                    params.Form, params.Item, params.FieldList, params.Callback, params.IDPrefix, params.Deletable);
                }, false);
            break;
        case "new":
            button.setAttribute("title", "New");
            button.addEventListener("click", ()=>{
                let element = params.Callback();
                let input = element.querySelector("input");
                if (input) input.focus();
                element.scrollIntoView();
            }, false);
            break;
        case "delete":
            button.setAttribute("title", "Delete");
            button.addEventListener("click", () => {
                if(!confirm("Are you sure you'd like to delete this? It cannot be undone.")) return;
                if ("Callback" in params) params.Callback();
                else deleteEntry(params.Form, params.Item);
                if("UpdateCallback" in params) params.UpdateCallback();
            }, false);
            break
        case "expand":
        case "collapse":
            button.setAttribute("title", "Expand / Collapse");
            button.addEventListener("click", ()=>{doAccordian(button);}, false);
        default:
            break;

    }
    return button;
};

function renderPurchase(purchase, updateCallback, expand = false, abbreviated = false, fixedSubtype = false){
    let displayContainer = E("form", {
        class: "compact collapsable row highlightable", 
        autocomplete: "off",
        id: `purchase${purchase.ID}_display`
    });

    if (!expand) displayContainer.classList.add("collapsed");

    let isSupplement = purchase.Type == PurchaseTypes.Supplement;
    let subtypeName = DP.ActiveJump.PurchaseSubTypes[purchase.Subtype].Name;
    if(!abbreviated)
        addReorderEventListeners(displayContainer, 
            purchase, DP.ActiveJump.Purchases, "Purchase");

    let name = E("span", 
        {class: `persistent label${abbreviated?" abbrev":""}`, id: `Name_${DP.ActiveJump.ID}_${purchase.ID}`})
    if(abbreviated) name.append(createIconButton((expand)?"collapse":"expand", "small alt"))
    name.append(E("span", {placeholder: "[nameless purchase]"}, T(purchase.Name)));

    let description = E("div", {class: "central userparagraph faint", id: `Description_${DP.ActiveJump.ID}_${purchase.ID}`}, 
        T(purchase.Description));

    let buttonRow = E("div", {class: "persistent button_row"});
    if (!abbreviated) buttonRow.append(
        createIconButton("delete", "smallish", {Form: displayContainer, Item: purchase, UpdateCallback: updateCallback})
        );
    buttonRow.append( 
        createIconButton("edit", "smallish", {
            Form: displayContainer, 
            Item: purchase, 
            FieldList: purchase.FieldList,
            Deletable: true,
            IDPrefix: `${DP.ActiveJump.ID}_${purchase.ID}`,
            Callback: (p, expand) => {
                updateCallback();
                return renderPurchase(p, updateCallback, expand, abbreviated);
            }
        }
    ));
    let durationRow = E("div", {class: "note vcentered central"});
    if(!abbreviated) 
        durationRow.setAttribute('id',  ((isSupplement)? "Duration" : "Temporary") + `_${DP.ActiveJump.ID}_${purchase.ID}` );
    if (isSupplement) {
        let jumpNumber = DP.ActiveJump.JumpNumber;
        let perkJumpNumber = purchase.Jump.JumpNumber;
        let revokeTime = perkJumpNumber + (+purchase.Duration) - jumpNumber;
        if (purchase.Duration > 0) {
            durationRow.append(T(`Revokes in ${revokeTime} Jump${revokeTime > 1 ? "s" : ""}`));
        }
    } else {
        if (purchase.Temporary) {
            durationRow.append(T("Expires at end of jump"));
        }
    }

    if (abbreviated) {
        let jumpName = purchase.Jump.Name;
        description.classList.add("abbrev");
        description.classList.add("persistent");
        name.append(E("div", {class:"note"}, T(`From: `),
            E("span", {placeholder: "[untitled jump]"}, T(`${jumpName}`))
        ));
        displayContainer.append(name, description, buttonRow);
        if(purchase.Type != PurchaseTypes.Subsystem) displayContainer.append(durationRow);
        return displayContainer;
    }

    name.classList.add("vcentered");

    let currencyAbbrev = (isSupplement) ? purchase.Supplement.Currency : purchase.Jump.Currencies[purchase.Currency].Abbrev;

    let costPane = E("div", {class: "persistent vcentered central"}, 
        E("span", {class:"sublabel"}, T("Cost:\u00A0")), 
        E("span", {id: `Value_${DP.ActiveJump.ID}_${purchase.ID}`},
            T(`${purchase.Cost}`)), 
        E("Span", (isSupplement)?{}:{id: `Currency_${DP.ActiveJump.ID}_${purchase.ID}`}, 
            T(`\u00A0${currencyAbbrev}\u00A0`))
        );
    
    let modifierNote = E("span", {class: "note", id:`CostModifier_${DP.ActiveJump.ID}_${purchase.ID}`})
    if(purchase.CostModifier != CostModifiers.Full)
        modifierNote.append(T(`(value of ${purchase.Value})`)); 
    costPane.append(modifierNote);

    let categoryString = purchase.Category[0];
    if(purchase.Category.length == 0) {
        categoryString = "Uncategorized";
    }
    if(purchase.Category.length > 1) {
        categoryString += " & " + purchase.Category[1];
    }
    if(purchase.Category.length > 2) {
        categoryString = "Multi-Category";
    }

    costPane.append(E("span", {class: "divider"}, T("|")),
         E("span", {class: "sublabel", id: `Category_${DP.ActiveJump.ID}_${purchase.ID}`}, T(categoryString)), 
         E("span", {class: "sublabel", id: `${fixedSubtype ? "X_" : ""}Subtype_${DP.ActiveJump.ID}_${purchase.ID}`}, T(`\u00A0${subtypeName}\u00A0`))
    );

    costPane.append(createIconButton((expand)?"collapse":"expand", "small alt"));
    
    displayContainer.append(name, costPane, buttonRow);
    if (purchase.Type == PurchaseTypes.Companion) {
        let companions = E("div", {id: `CompanionIDs_${DP.ActiveJump.ID}_${purchase.ID}`});
            companions.append(
                E("span", {placeholder: "No one imported!", class:"note"}, 
                T(`${purchase.CompanionIDs.map( (id) => Chain.Characters[id].Name).join(", ")}`))
            );
        displayContainer.append(companions, description);

        let pointsRow = E("div", {class: "central needs_space vcentered"});
        let allowances = E("span", {id: `Allowances_${DP.ActiveJump.ID}_${purchase.ID}`, title: "Freely spendable points"}, 
            E("span", {class:"label needs_space"}, T("Allowance: ")), 
            E("span", {placeholder: "None"}, 
                T(`${Object.entries(purchase.Allowances).map( 
                    ([c, total]) => `${total} ${DP.ActiveJump.Currencies[c].Abbrev}`
                ).join(", ")}`))
        );

        let stipends = [];
        for (let c in DP.ActiveJump.Currencies) {
            let cStipendContainer = 
                E("span", {id: `Stipends_${c}_${DP.ActiveJump.ID}_${purchase.ID}`, style: {marginLeft:"0.5rem"},  title: "Points to be spent in a particular category"});
            if (Object.keys(purchase.Stipends[c]).length > 0)  cStipendContainer.append(
                E("span", {class: "label needs_space"}, 
                    T(`${DP.ActiveJump.Currencies[c].Abbrev} Stipends: `)
                ), 
                E("span", {placeholder: "None"}, 
                T(`${Object.entries(purchase.Stipends[c]).map(
                    ([type, stipend]) => `${stipend} for ${DP.ActiveJump.PurchaseSubTypes[type].Name.toLowerCase()}s`
                ).join(", ")}`))
            );
            stipends.push(cStipendContainer);
        }

        pointsRow.append(allowances, ...stipends);
        displayContainer.append(pointsRow);

    } else {
        let tags = E("div", {id: `Tags_${DP.ActiveJump.ID}_${purchase.ID}`, class: "note"});
        if (purchase.Tags.length > 0) {
            tags.append(
                T(`${(purchase.Tags.length > 1)?"Tags:" : "Tag:"} ${purchase.Tags.join(", ")}`));
        }
        displayContainer.append(tags);
        displayContainer.append(description);
        if(purchase.Type != PurchaseTypes.Subsystem) displayContainer.append(durationRow);
    }

    return displayContainer;
}

function renderDrawback(drawback, expand = false){
    let displayContainer = E("form", {
        autocomplete: "off", onSubmit: "return false;",
        class: "collapsable row highlightable", 
        id: `drawback${drawback.ID}_display`
    });

    if (!expand) displayContainer.classList.add("collapsed");

    let IDSuffix = (drawback.Jump) ? `${DP.ActiveJump.ID}_${drawback.ID}` : `ChainDrawback_${drawback.ID}`;

    if(drawback.Jump) {
        addReorderEventListeners(displayContainer, 
            drawback, DP.ActiveJump.Drawbacks, "Drawback");    
    } else {
        addReorderEventListeners(displayContainer, 
            drawback, Chain.Drawbacks, "Drawback");    
    }

        
    let name = E("span", {class: `vcentered persistent label`, id: `Name_${IDSuffix}`})
    name.append(E("span", {placeholder: `[nameless ${(drawback.Type == DrawbackTypes.Scenario)? "scenario" : "drawback"}]`}, T(drawback.Name)));

    let description = E("div", {class: "central userparagraph", id: `Description_${IDSuffix}`}, 
        T(drawback.Description));

    let buttonRow = E("div", {class: "persistent button_row"});
    buttonRow.append(
        createIconButton("delete", "smallish", {Form: displayContainer, Item: drawback}), 
        createIconButton("edit", "smallish", {
            Form: displayContainer, 
            Item: drawback, 
            FieldList: drawback.FieldList,
            Deletable: true,
            IDPrefix: `${IDSuffix}`,
            Callback: (d, expand) => 
                {budgetUpdate(); return renderDrawback(d, expand);}
        }
    ));

    let currencyAbbrev = (drawback.Jump)?DP.ActiveJump.Currencies[drawback.Currency].Abbrev:"CP";

    let costPane = E("div", {class: "persistent vcentered central"}, 
        E("span", {class:"sublabel"}, T("Value:\u00A0")), 
        E("span", {id: `Value_${IDSuffix}`},
            T(`${drawback.Cost}`)
        ), T('\u00A0'), 
        E("span", {id: `Currency_${IDSuffix}`}, 
            T(`${currencyAbbrev}`)
        )
    );
    let modifierText = "";
    if (drawback.CostModifier == CostModifiers.Reduced){
        modifierText = "half";
    }

    if (drawback.CostModifier == CostModifiers.Free){
        modifierText = "no";
    }

    let modifierNote = E("span", {class: "note"}, 
        T(`\u00A0(taken for\u00A0`), 
        E("span", {class: "nonzero_numeric", id:`CostModifier_${IDSuffix}`}, 
            T(modifierText)
        ), 
        T(`\u00A0points)`)
    );

    costPane.append(modifierNote);    

    costPane.append(createIconButton((expand)?"collapse":"expand", "small alt"));
    
    displayContainer.append(name, costPane, buttonRow);
    if ("ItemStipend" in drawback) {
        let stipendsRow = E("div", {class: "note sideentry"});
        stipendsRow.append(
            E("div", {}, 
                E("span", {class: "sublabel"}, T("Item Stipend:\u00A0")), 
                E("span", {id: `ItemStipend_${IDSuffix}`}, T(`${drawback.ItemStipend}`)), 
                T("\u00A0CP")
            ), E("div", {}, 
                E("span", {class: "sublabel"}, T("Companion Stipend:\u00A0")), 
                E("span", {id: `CompanionStipend_${IDSuffix}`}, T(`${drawback.CompanionStipend}`)), 
                T("\u00A0CP")
            )
        );
        displayContainer.append(stipendsRow);
    }

    if(drawback.Type == DrawbackTypes.Scenario) {
        let rewards = E("div", {class: "note userparagraph", id: `Reward_${IDSuffix}`});
        if (drawback.Reward.length > 0) {
            rewards.append(
                E("span", {class: "label"}, T(`Rewards:\u00A0`)), 
                T(drawback.Reward)
            )
        }
        displayContainer.append(rewards);

    }

    displayContainer.append(description);


    if ("AutoRevoke" in drawback) {
        let durationRow = E("div", {class: "note vcentered central", id:`AutoRevoke_${IDSuffix}`});
        if (drawback.AutoRevoke > 0) {
            durationRow.append(T(`Revokes after ${drawback.AutoRevoke} Jumps`));
        }
        displayContainer.append(durationRow);
    }

    return displayContainer;
}

function assembleOptions(select, item, fieldInfo){
     for (let i in fieldInfo.Options){
        let selected;
        let value = item;
        for(let step of fieldPath){
            value = value[step];
        }
        if (select.Single) selected = fieldInfo.Options[i].Value == value;
        else selected = value.includes(fieldInfo.Options[i].Value);
        select.AddOption(fieldInfo.Options[i].Text, fieldInfo.Options[i].Value, selected);
    }
}

function assembleNumericOptions(numericSelect, item, fieldInfo){
    let value = item;
    for(let step of fieldPath){
        value = value[step];
    }
    for (let i in fieldInfo.Options){
        numericSelect.AddOption(fieldInfo.Options[i].Text, 
            fieldInfo.Options[i].Field, 
            value[fieldInfo.Options[i].Field]);
    }
}


//TODO: temporary perks
function swapInInputs(form, item, fieldList, renderCallback, idPrefix, deletable = true){
    let inputList = {};
    focused = false;
    for (let field in fieldList) {
        let inputContainer = form.querySelector(`#${field}_${idPrefix}`);
        if(!inputContainer) continue;

        let input;
        let placeholder = (fieldList[field].Placeholder) ? fieldList[field].Placeholder : field;
        switch (fieldList[field].InputType){
            case "textarea":
                input = E("textarea", {placeholder: placeholder});
                break;
            case "text":
            case "number":
                input = E("input", {type: fieldList[field].InputType, placeholder: placeholder});
                break;
            case "checkbox":
                input = E("input", {type: fieldList[field].InputType});
                break;
            case "select":
                input = new CheckBoxSelect(placeholder, true); 
                break;
            case "multiselect":
                input = new CheckBoxSelect(placeholder, false, !fieldList[field].Abbreviate, 
                    fieldList[field].DefaultSingle); 
                break;
            case "optional_numeric":
                input = new OptionalNumeric(fieldList[field].InactiveLabel, fieldList[field].ActiveLabel);
                break;
            case "multiselect_numeric":
                input = new MultiNumeric(placeholder);
                break;
        }
        
        input.setAttribute("name", field);

        if(inputContainer.hasAttribute("placeholder")){
            input.setAttribute("placeholder", inputContainer.getAttribute("placeholder"));
        }

        fieldPath = field.split("_");
        let value = item;
        for(let step of fieldPath){
            value = value[step];
        }
        if (fieldList[field].DataType == "[String]") value = value.join(", ");

        if (fieldList[field].InputType != "checkbox") {input.value = value;}
        else {
            input.checked = value;
        }

        if(fieldList[field].InputType == "multiselect" || fieldList[field].InputType == "select") {
            if(fieldList[field].Options.length < 2 
                && !(fieldList[field].Important && fieldList[field].Options.length == 1)) continue;
            assembleOptions(input, item, fieldList[field]);
        }

        if(fieldList[field].InputType == "multiselect_numeric") {
            assembleNumericOptions(input, item, fieldList[field]);
        }

        inputList[field] = input;

        if(fieldList[field].InputType.includes("select") || fieldList[field].InputType == "optional_numeric") {
            inputContainer.replaceChildren(input.DOM);
        }
        else 
            inputContainer.replaceChildren(input);
        if (fieldList[field].InputType == "textarea") setUpTextArea(input);
        if ("Step" in fieldList[field]) input.setAttribute("step", fieldList[field].Step);
        if (fieldList[field].InputType == "checkbox"){
            let label = ("Placeholder" in fieldList[field]) ? fieldList[field].Placeholder : field;
            input.setAttribute("id", `${field}_${idPrefix}_1`);
            input.after(E("label", {for: `${field}_${idPrefix}_1`}, T(label)));
        }
    }
    let size = "";
    if (form.querySelector(".edit").classList.contains("small")) size = "small";
    if (form.querySelector(".edit").classList.contains("smallish")) size = "smallish";
    form.querySelector(".edit").replaceWith(
        createIconButton("save", size, 
        {Form: form, InputList: inputList, FieldList: fieldList, Item: item, Callback: renderCallback})
    );

    form.querySelector("input, textarea").focus();

    return inputList;

}

function deleteEntry(display, item){
    display.remove();
    item.Unregister();
}

function saveForm(inputList, item, fieldList, callback){
    for (let field in fieldList) {
        let input = inputList[field];
        if (!input) continue;
        let fieldPath = field.split("_");
        let innerItem = item;
        for (let i = 0; i < fieldPath.length - 1; i++){
            innerItem = innerItem[fieldPath[i]];
        }
        let step = fieldPath[fieldPath.length - 1];

        let value = (fieldList[field].InputType != "checkbox") ? input.value : input.checked;
        
        switch(fieldList[field].DataType){
            case "String":
                value = value; break;
            case "Integer":
                value = parseInt(value, 10); break;
            case "Decimal":
                value = parseFloat(value); break;    
            case "[String]":
                value = value.replace(/(\s)+/g, " ").replace(/(\s)*,(\s)*/g, ",").split(",").filter((s) => s.length > 0);
        }

        innerItem[step] = value;

    }
    callback();
}

function renderBudgetBar(){
    let budgetBar = E("div", {class: "accent_row"});

    let titleSpan = E("span", {class: "vcentered"});
    title = E("span", {class:"label jumptitle", placeholder:"[untitled jump]", contenteditable: "true", style:{justifySelf: "left"}}, 
        T(DP.ActiveJump.Name)
    );

    title.addEventListener("paste", (e) => {
        e.preventDefault();
        let text = (e.originalEvent || e).clipboardData.getData('text/plain');
        document.execCommand('inserttext', false, text);
    }, false);

    title.addEventListener("input", (e) => {
        let toDelete = [];
        for (let node of title.childNodes){
            if (node.nodeType == Node.ELEMENT_NODE) toDelete.push(node);
        }
        for (let node of toDelete) {
            node.replaceWith(T(node.textContent));
        }

        DP.ActiveJump.UpdateName(title.textContent);

    }, false);

    titleSpan.append(title);
    if(DP.ActiveJump.URL.length > 0) {
        titleSpan.append(
            E("a", {class: "icon button link small", style:{position: "relative", top: "-0.2rem"}, href: DP.ActiveJump.URL, target:"_blank"})
        )
    }

    budgetBar.append(titleSpan);


    if(!DP.ActiveJump.JumpedBy(DP.ActiveJumperID)){
        budgetBar.classList.add("error");
        budgetBar.append(T("Character Not Imported!"));
        return budgetBar;
    }

    for (let c in DP.ActiveJump.Currencies) {
        let cDisplay = E("span", {class: "bubble_accent"}, 
            E("span", {class: "label"}, 
                T(`${DP.ActiveJump.Currencies[c].Abbrev}:\u00A0`)
            )
        );
        let cNum = T();
        cDisplay.append(cNum);
        budgetBar.append(cDisplay);
        DP.ActiveJump.RenderLocation[DP.ActiveJumperID][c] = cNum;

        for (let subtype in DP.ActiveJump.PurchaseSubTypes){
            let cDisplay2 = E("span", {class: "bubble_accent"}, 
                E("span", {class: "label"}, 
                    T(`${DP.ActiveJump.PurchaseSubTypes[subtype].Name} Stipend:\u00A0`)
                )
            );
            let cNum2 = T();
            cDisplay2.append(E("span", {}, cNum2));
            cDisplay2.append(`\u00A0${DP.ActiveJump.Currencies[c].Abbrev}`);
            budgetBar.append(cDisplay2);
            DP.ActiveJump.StipendRenders[DP.ActiveJumperID][c][subtype] = cNum2;  
            
            new MutationObserver(() => {
                cDisplay2.style.setProperty("display", (cNum2.nodeValue > 0) ? "inline" : "none", "important");
              }).observe(cNum2, {characterData: true, childList: true});
              

        }
    }

    budgetUpdate();

    return budgetBar;

}

function renderPurchaseFilterBar(purchaseType, renderCallback, listContainer, supplement = undefined){

    let filterBar = E("div", {class: "accent_row"});

    let categorySelector = new CheckBoxSelect("Category", false, true);    
    
    let categories = ((supplement) ? supplement.PurchaseCategories : Chain.PurchaseCategories[purchaseType]);

    for (let cat of categories) {
        categorySelector.AddOption(cat.Name, cat.Name);
    }

    let viewType = new CheckBoxSelect("View Type", true);
    viewType.AddOption("Chronological View", "chronological", true);
    viewType.AddOption("Tag View", "tags", false);

    let expandCheckBox = E("input", {type: "checkbox", id:"listExpand"});
    let expandControl = E("div", {class: "vcentered"}, 
        expandCheckBox, 
        E("label", {for:"listExpand"}, T("Expand All")));

    expandCheckBox.addEventListener("input", () => {
        if (expandCheckBox.checked) {
            listContainer.querySelectorAll(".expand").forEach(
                (n) => {doAccordian(n, 1);});
        } else {
            listContainer.querySelectorAll(".collapse").forEach(
                (n) => {doAccordian(n, 0);});
        }

    }
    );

    let compositeCheckBox = E("input", {type: "checkbox", id:"composite"});
    let compositeControl = E("div", {class: "vcentered"}, 
    compositeCheckBox, 
        E("label", {for:"composite"}, T("Combine All Characters")));

    let supplementCheckBox = E("input", {type: "checkbox", id:"supplements"});
    let supplementControl = E("div", {class: "vcentered"}, 
    supplementCheckBox, 
        E("label", {for:"supplements"}, T("Include Supplements")));    

    let searchBar = E("input", {type: "text", class: "searchbar", id:"searchbar", autocomplete: "off"});

    let callback = () => {
        let params = {
            Category: categorySelector.value, 
            View: viewType.value,
            IncludeSupplement: supplementCheckBox.checked,
            SearchTerm: searchBar.value,
            Expand: expandCheckBox.checked,
            Composite: compositeCheckBox.checked
        }
        renderCallback(params);
    }

    viewType.addInputListener(callback);
    categorySelector.addInputListener(callback);
    compositeCheckBox.addEventListener("click", callback);
    supplementCheckBox.addEventListener("click", callback);
    searchBar.addEventListener("input", callback);

    filterBar.append(searchBar);
    filterBar.append(categorySelector.DOM);
    if (!supplement) filterBar.append(viewType.DOM);
    filterBar.append(expandControl);
    if(!supplement) filterBar.append(supplementControl);
    if (purchaseType == PurchaseTypes.Item) filterBar.append(compositeControl);


    callback();

    return [filterBar, searchBar];
}

function listPurchasesChronologically(panel, purchaseType, categories = [], searchTerm = "", 
    expand = false, composite = false, includeSupplement = false, supplement = undefined){
    let jumpNumber = Chain.Jumps[Chain.Jumps.length - 1].JumpNumber + 1;
    for (let j of Chain.Jumps) {
        let jNumber = j.JumpNumber;
        for (let p of j.Purchases) {
            if ( ( (p.Type != purchaseType) 
                    && ( (!includeSupplement) 
                        || (p.Type != PurchaseTypes.Supplement) 
                        || (p.Supplement.ItemLike != (purchaseType == PurchaseTypes.Item) )
                    ) 
                )   
                || (p.JumperID != DP.ActiveJumperID && (!supplement || (supplement.CompanionAccess != CompanionAccess.Communal)) && !composite)
                || (categories.length >> 0 && p.Category.filter(c => categories.includes(c)).length == 0)
                || p.Temporary
                || (supplement && p.Supplement.ID != supplement.ID)) continue;
            if (p.Type == PurchaseTypes.Supplement && p.Duration > 0 && p.Duration <= (jumpNumber - jNumber)) continue; 
            if (!p.Includes(searchTerm)) continue;
            panel.append(renderPurchase(p, () => {}, expand, true, false));
        }
    }
}

function listPurchasesByTag(panel, purchaseType, categories, searchTerm = "", 
    expand = false, composite = false, includeSupplement = false, supplement = undefined){
    let tags = {};
    let untagged = [];
    let perkDisplays = {};
    let update = (p) => {
        for (let i in perkDisplays[p.ID]) {
            let display = perkDisplays[p.ID][i];
            let expanded = display.querySelector(".collapse");
            let newDisplay = renderPurchase(p, () => {update(p);}, expanded, true, false);
            display.replaceWith(newDisplay);
            perkDisplays[p.ID][i] = newDisplay;
        }
    }
    let jumpNumber = Chain.Jumps[Chain.Jumps.length - 1].JumpNumber + 1;
    for (let j of Chain.Jumps) {
        let jNumber = j.JumpNumber;
        for (let p of j.Purchases) {
            if ( (p.Type != purchaseType 
                    && (!includeSupplement 
                        || (p.Type != PurchaseTypes.Supplement) 
                        || (p.Supplement.ItemLike != (purchaseType == PurchaseTypes.Item) ) 
                        )
                )   
                || (p.JumperID != DP.ActiveJumperID && (!supplement || (supplement.CompanionAccess != CompanionAccess.Communal)) && !composite)
                || (categories.length >> 0 && p.Category.filter(c => categories.includes(c)).length == 0)
                || p.Temporary
                || (supplement && p.Supplement.ID != supplement.ID)) continue;
            if ( p.Type == PurchaseTypes.Supplement && p.Duration > 0 && p.Duration <= (jumpNumber - jNumber)) continue; 
            if(!p.Includes(searchTerm)) continue;
            perkDisplays[p.ID] = [];
            if (p.Tags.length == 0) {
                untagged.push(p);
            }
            for (let t of p.Tags){
                if (t in tags == false){
                    let textNode = T();
                    let tagContainer = createCollapsingDivider(textNode, expand);
                    tags[t] = {Container: tagContainer, Label: textNode, Count: 0}
                    panel.append(tagContainer);
                }
                tags[t].Count++;
                let pDisplay = renderPurchase(p, () => {update(p);}, expand, true, false);
                perkDisplays[p.ID].push(pDisplay);
                tags[t].Container.append(pDisplay);
            }
        }
    }

    for (let t in tags){
        tags[t].Label.nodeValue = `${t} (${tags[t].Count} Item${tags[t].Count > 1 ? "s" : ""}):`;
    }

    if(untagged.length > 0){
        let untaggedContainer = createCollapsingDivider(
            `Untagged (${untagged.length} Item${untagged.length > 1 ? "s" : ""}):`, expand);
        for (let p of untagged) {
            untaggedContainer.append(renderPurchase(p, () => {}, expand, true, false));
        }
        panel.append(untaggedContainer);
    }

    
}

function listPurchases(panel, purchaseType, params, supplement = undefined){
    panel.replaceChildren();
    let categories = params.Category;
    let searchTerm = params.SearchTerm;
    let expand = params.Expand;
    let composite = params.Composite;
    let includesSupplement = params.IncludeSupplement;
    if (params.View == "chronological") {
        listPurchasesChronologically(panel, purchaseType, categories, searchTerm, expand, composite, includesSupplement, supplement);
    }
    if (params.View == "tags") {
        listPurchasesByTag(panel, purchaseType, categories, searchTerm, expand, composite, includesSupplement, supplement);
    }
    panel.append(
        E("div", {class: "row"}, 
            E("div", {class:"central placeholder vcentered"}, T("Nothing Found!"))
        )
    );

}

function renderPurchaseList(panel, purchaseType, purchaseSubtype = null){

    let purchaseList = DP.ActiveJump.Purchases;

    for (let i in purchaseList) {
        let p = purchaseList[i];
        if (purchaseSubtype && (purchaseSubtype != p.Subtype)) continue;
        if (p.JumperID == DP.ActiveJumperID && p.Type == purchaseType){
            panel.append(renderPurchase(p, budgetUpdate, false, false, !!purchaseSubtype));       
        }
    }

    let bottomRow = E("div", {class: "row"}, 
        E("div", {class:"central placeholder vcentered"}, T("No Purchases Yet!"))
    );
    let newPurchase = E("div", {class: "button_row"}, 
        createIconButton("new", "", { Callback: () => {
            let p = DP.ActiveJump.NewPurchase(DP.ActiveJumperID, purchaseType);
            if (purchaseSubtype) p.Subtype = purchaseSubtype;
            let newRender = renderPurchase(p, budgetUpdate, true, false, !!purchaseSubtype);
            panel.insertBefore(newRender, bottomRow);
            swapInInputs(newRender, p, p.FieldList, (pu, expand) => {
                budgetUpdate(); 
                return renderPurchase(pu, budgetUpdate, expand, false, !!purchaseSubtype);
            }, `${DP.ActiveJump.ID}_${p.ID}`);
            return newRender;
        }})
    );
    bottomRow.append(newPurchase);
    if(purchaseType == PurchaseTypes.Companion){
        companions = false;
        for (let jumperID in Chain.Characters){
            if(jumperID != DP.ActiveJumperID && !Chain.Characters[jumperID].Primary) {companions = true; break;}
        }
        if (companions) panel.append(bottomRow);
        else panel.append(
            E("div", {class: "row"}, 
                E("div", {class:"central vcentered"}, T("No Characters To Import!"))
            ));
    } else {
        panel.append(bottomRow);
    }
}

function renderSubsystemScreen(panel, subsystem){
    panel.replaceChildren();
    panel.append(renderBudgetBar());

    let accessPerk;
    let accessGranted = subsystem in DP.ActiveJump.SubsystemAccess[DP.ActiveJumperID];

    let head = E("div", {class: "row"});
    let accessRequest = (E("div", {class: "central vcentered button"}, 
            T("Access Subsystem")
        )
    );

    let accessPerkDisplay = E("form", {class: "row", autocomplete: "off", onSubmit: "return false;"});

    let currencySelect = new CheckBoxSelect("", true);
    let stipendInput = E("input", {type: "number", step: "50", value: "0", min: "0"});
    let stipendPanel = E("div", {class: "row"}, 
            E("span", {class: "label vcentered"}, T("Stipend:\u00A0")),
            E("span", {class:"vcentered"}, 
                stipendInput,
                T("\u00A0" + DP.ActiveJump.Currencies[DP.ActiveJump.PurchaseSubTypes[subsystem].Currency].Abbrev)
            )
    );
    
    let hrule = E("div", {class:"hrule"});
    let details = createCollapsingDivider("Subsystem Purchases:", true);
    renderPurchaseList(details, PurchaseTypes.Subsystem, subsystem);


    stipendInput.addEventListener("input", () => {
        DP.ActiveJump.SubsystemAccess[DP.ActiveJumperID][subsystem].Stipend = Math.floor(stipendInput.value);
        budgetUpdate();
    })

    accessRequest.addEventListener("click", () => {
        accessPerk = DP.ActiveJump.NewPurchase(DP.ActiveJumperID, 
            DP.ActiveJump.PurchaseSubTypes[subsystem].Type);
        accessPerk.Name = `[untitled ${DP.ActiveJump.PurchaseSubTypes[subsystem].Name.toLowerCase()}]`;
        stipendInput.value = 0;
        DP.ActiveJump.SubsystemAccess[DP.ActiveJumperID][subsystem] = {Purchase: accessPerk, 
            Stipend: 0}
        accessPerkDisplay.append(renderPurchase(accessPerk, () => {
            let accessGranted = subsystem in DP.ActiveJump.SubsystemAccess[DP.ActiveJumperID]; 
            budgetUpdate();
            if (!accessGranted) {
                head.replaceChildren(accessRequest);
                hrule.remove();
                details.remove();
            }
        }
        , true, false, false));
        head.replaceChildren(stipendPanel);
        panel.append(hrule);
        panel.append(details);
    }
    );

    panel.append(head, accessPerkDisplay);

    if (accessGranted){
        stipendInput.value = DP.ActiveJump.SubsystemAccess[DP.ActiveJumperID][subsystem].Stipend;
        currencySelect.value = DP.ActiveJump.SubsystemAccess[DP.ActiveJumperID][subsystem].Currency;
        head.replaceChildren(stipendPanel);
        accessPerk = DP.ActiveJump.SubsystemAccess[DP.ActiveJumperID][subsystem].Purchase;
        accessPerkDisplay.append(renderPurchase(accessPerk, () => {
            let accessGranted = subsystem in DP.ActiveJump.SubsystemAccess[DP.ActiveJumperID]; 
            budgetUpdate();
            if (!accessGranted) {
                head.replaceChildren(accessRequest);
                hrule.remove();
                details.remove();
            }

        }
        , true, false, false));
        panel.append(hrule);
        panel.append(details);
    } else {
        head.append(accessRequest);
    }


}

function renderSupplementScreen(panel, supplement) {
    panel.replaceChildren();

    let intialBudget = Chain.TallySupplementPoints(supplement, DP.ActiveJump, DP.ActiveJumperID);
    let maxInvestment = supplement.MaxInvestment;
    let parentID = (DP.ActiveJump.ParentJumpID < 0) ? DP.ActiveJump.ID : DP.ActiveJump.ParentJumpID;
    for (let j of Chain.Jumps) {
        if (j.ID != DP.ActiveJump.ID 
            && (j.ID == parentID || j.ParentJumpID == parentID)) {
                maxInvestment -= j.SupplementInvestments[DP.ActiveJumperID][supplement.ID];
        }
    }

    panel.append(renderBudgetBar());

    let titleSpan = E("span", {class: "faint label", style:{marginRight: "3rem"}}, 
        T(supplement.Name)
    )
    
    if(supplement.URL.length > 0) {
        titleSpan.append(
            E("a", {class: "icon button link small", style:{marginLeft: "0.5rem", position: "relative", top: "-0.1rem"}, href: supplement.URL, target:"_blank"})
        )
    }

    let budgetText = T("");
    let investmentInput = 
        E("input", {type: "number", step: "50", min: "0", 
            max: maxInvestment, 
            value: DP.ActiveJump.SupplementInvestments[DP.ActiveJumperID][supplement.ID]});

    let updateSupplementScreen = () => {
        budgetUpdate();
        let purchasesCost = 0;
        for (let i in purchaseList) {
            let p = purchaseList[i];
            if ( ((supplement.CompanionAccess == CompanionAccess.Communal) || p.JumperID == DP.ActiveJumperID) 
                && p.Type == PurchaseTypes.Supplement && p.Supplement.ID == supplement.ID){
                purchasesCost += p.Cost;
            }
        }
        budgetText.nodeValue = intialBudget 
            + Math.round(
                DP.ActiveJump.SupplementInvestments[DP.ActiveJumperID][supplement.ID] * supplement.InvestmentRatio / 100)
            - purchasesCost;            
    }

    let budgetPanel = E("div", {class: "central vcentered"},
        titleSpan,
        E("div", {style:{width: "5rem"}},
            E("span", {class: "label"}, T(`${supplement.Currency}:\u00A0`)),
            budgetText
        ),
        E("span", {class:"label"}, T(`${DP.ActiveJump.Currencies[0].Abbrev} Investment:\u00A0`)),
        investmentInput
    );

    investmentInput.addEventListener("input", () => {
        investmentInput.value = Math.max(0, Math.min(investmentInput.value, maxInvestment));
        DP.ActiveJump.SupplementInvestments[DP.ActiveJumperID][supplement.ID] = investmentInput.value;
        updateSupplementScreen();
        }
    )

    panel.append(budgetPanel);

    oldPurchases = createCollapsingDivider("Purchases From Previous Jumps:", false);
    let purchaseList= Chain.GetSupplementPurchases(supplement, DP.ActiveJump);    

    for (let i in purchaseList) {
        let p = purchaseList[i];
        if (p.JumperID == DP.ActiveJumperID){
            oldPurchases.append(renderPurchase(p, budgetUpdate, false, true));       
        }
    }

    oldPurchases.append(E("div", {class: "row"}, 
        E("div", {class:"central placeholder vcentered"}, T("No Previous Purchases!"))
    ));

    newPurchases = createCollapsingDivider("New Purchases:", true);
    purchaseList= DP.ActiveJump.Purchases;    

    for (let i in purchaseList) {
        let p = purchaseList[i];
        if ( ((supplement.CompanionAccess == CompanionAccess.Communal) || p.JumperID == DP.ActiveJumperID) 
            && p.Type == PurchaseTypes.Supplement && p.Supplement.ID == supplement.ID){
            newPurchases.append(renderPurchase(p, budgetUpdate, false, false));   
        }
    }

    updateSupplementScreen();

    let bottomRow = E("div", {class: "row"}, 
        E("div", {class:"central placeholder vcentered"}, T("No New Purchases!"))
    );
    let newPurchase = E("div", {class: "button_row"}, 
        createIconButton("new", "", { Callback: () => {
            let p = DP.ActiveJump.NewPurchase(DP.ActiveJumperID, PurchaseTypes.Supplement, supplement);
            let newRender = renderPurchase(p, budgetUpdate, true, false);
            newPurchases.insertBefore(newRender, bottomRow);
            swapInInputs(newRender, p, p.FieldList, (pu, expand) => {
                updateSupplementScreen(); return renderPurchase(pu, updateSupplementScreen, expand, false);
            }, `${DP.ActiveJump.ID}_${p.ID}`);
            return newRender;
        }})
    );
    bottomRow.append(newPurchase);
    newPurchases.append(bottomRow);
    panel.append(oldPurchases, newPurchases);
}


function renderDrawbackList(panel, drawbackType){
    for (let i in DP.ActiveJump.Drawbacks) {
        let d = DP.ActiveJump.Drawbacks[i];
        if (d.JumperID == DP.ActiveJumperID && d.Type == drawbackType){
            panel.append(renderDrawback(d, false));
        }
    }

    let bottomRow = E("div", {class: "row"}, 
        E("div", {class:"central placeholder vcentered"}, 
        T(`No ${(drawbackType == DrawbackTypes.Scenario)? "Scenarios" : "Drawbacks"} Taken!`))
    );

    let newPurchase = E("div", {class: "button_row"}, 
        createIconButton("new", "", { Callback: () => {
            let d = DP.ActiveJump.NewDrawback(DP.ActiveJumperID, drawbackType);
            let newRender = renderDrawback(d, true);
            panel.insertBefore(newRender, bottomRow);
            swapInInputs(newRender, d, d.FieldList, (dr, expand) => {
                budgetUpdate(); return renderDrawback(dr, expand);
            }, `${DP.ActiveJump.ID}_${d.ID}`);
            return newRender;
        }})
    );

    bottomRow.append(newPurchase);
    panel.append(bottomRow);
}

function renderDrawbackScreen(panel) {
    panel.replaceChildren();
    panel.append(renderBudgetBar());

    if (Chain.Bank.Enabled)
    panel.append(renderBankingPanel(), E("div", {class:"hrule"}));

    let drawbacks = createCollapsingDivider("Drawbacks:", true);
    renderDrawbackList(drawbacks, DrawbackTypes.Drawback);

    let scenarios = createCollapsingDivider("Scenarios:", true);
    renderDrawbackList(scenarios, DrawbackTypes.Scenario);

    panel.append(drawbacks, E("div", {class:"hrule"}), scenarios);

}

function renderChainDrawbackScreen(panel){
    panel.replaceChildren();
    for (let i in Chain.Drawbacks) {
        let d = Chain.Drawbacks[i];
        panel.append(renderDrawback(d, true));
    }

    let bottomRow = E("div", {class: "row"}, 
        E("div", {class:"central placeholder vcentered"}, 
        T(`No Chain Drawbacks Taken!`))
    );

    let newPurchase = E("div", {class: "button_row"}, 
        createIconButton("new", "", { Callback: () => {
            let d = new ChainDrawback();
            Chain.RegisterChainDrawback(d);
            let newRender = renderDrawback(d, true);
            panel.insertBefore(newRender, bottomRow);
            swapInInputs(newRender, d, d.FieldList, (dr, expand) => {
                return renderDrawback(dr, expand);
            }, `ChainDrawback_${d.ID}`);
            return newRender;
        }})
    );

    bottomRow.append(newPurchase);
    panel.append(bottomRow);
}


function renderPurchaseScreen(panel, type, subtype = null) {
    panel.replaceChildren();
    panel.append(renderBudgetBar());

    renderPurchaseList(panel, type, subtype);
}

function renderJumperCharacteristic(field, labelText, expanded) {

    let jumper = Chain.Characters[DP.ActiveJumperID];
    if (!labelText) labelText = field;
    let single = field in jumper.FieldList;
    if (!single && !expanded) expanded = jumper[field].Description.length > 0;

    let form = E("form", {
        class: `row compact highlightable`,
        autocomplete: "off", onSubmit: "return false;"}
    );
    
    let value = ""; 
    if (!single) value = jumper[field].Summary;
    else if (jumper.FieldList[field].InputType == "select") {
        for (let o of jumper.FieldList[field].Options){
            if (o.Value == jumper[field]) {value = o.Text; break;}
        }
    }
    else value = jumper[field];

    if (!single) form.classList.add("collapsable");
    let entryField = (single) ? field : field + "_Summary";
    let label = E("span", {class: "persistent vcentered label", style:{justifyContent: "right"}}, T(`${labelText}:`));
    let entry =  E("span", {class: "vcentered persistent"}, 
        E("span", {id: `${entryField}_${DP.ActiveJumperID}`}, T(value)),
    );

    if(!single) {
        if (!expanded) form.classList.add("collapsed");
        entry.append(createIconButton((expanded)?"collapse":"expand", "small alt"));
    }

    entry.append(
        createIconButton("edit", "small", {Form: form, 
            Item: jumper, 
            FieldList: jumper.FieldList, 
            Deletable: false,
            IDPrefix: `${DP.ActiveJumperID}`, 
            Callback: (item, expand) => {
                document.getElementById("jumper_passport_sidebar").replaceWith(renderPassportSidebar());
                return renderJumperCharacteristic(field, labelText, expand);
            }
        }
    ));

    form.append(label, entry);

    if(!single) {
        form.append(E("div"),
            E("span", {class: "note", style: {textAlign: "right"}},
                T("Description:") 
            ), 
            E ("span", {class: "faint userparagraph", id: `${field}_Description_${DP.ActiveJumperID}`}, 
                T(jumper[field].Description)
            )
        );
    }


    return form;

}


function renderOriginCategory(origin, originID, expanded = undefined) {
    let single = DP.ActiveJump.OriginCategories[originID].Single;

    let form = E("form", {
        class: `row compact highlightable`,
        autocomplete: "off", onSubmit: "return false;",
        id:`jump${DP.ActiveJump.ID}_${DP.ActiveJumperID}_${originID}_form`});
    if(!single) form.classList.add("collapsable");

    let label = E("span", {class: "persistent vcentered label", style:{justifyContent: "right"}}, 
        T(`${DP.ActiveJump.OriginCategories[originID].Name}:`));
    let entry =  E("span", {class: "vcentered persistent"}, 
        E("span", {id: `Name_${DP.ActiveJump.ID}_${originID}`}, T(origin.Name)),
        E("span", {class:"sublabel"}, 
            T("\u00A0(Cost:\u00A0"), 
            E("span", {id: `Cost_${DP.ActiveJump.ID}_${originID}`},
                T(`${origin.Cost} ${DP.ActiveJump.Currencies[0].Abbrev}`)
            ), 
            T(")\u00A0")
        )
    );
    if(expanded === undefined) expanded = origin.Description.length > 0;

    if(!single) {
        if (!expanded) form.classList.add("collapsed");
        entry.append(createIconButton((expanded)?"collapse":"expand", "small alt"));
    }
    entry.append(
        createIconButton("edit", "small", {Form: form, 
            Item: origin, 
            FieldList: DP.ActiveJump.FieldList, 
            Deletable: false,
            IDPrefix: `${DP.ActiveJump.ID}_${originID}`, 
            Callback: (item, expand) => {
                budgetUpdate();
                return renderOriginCategory(item, originID, expand);
            }
        }
    ));

    form.append(label, entry);

    if(!single) {
        form.append(E("div"),
            E("span", {class: "note", style: {textAlign: "right"}},
                T("Description:") 
            ), 
            E ("span", {class: "faint userparagraph", id: `Description_${DP.ActiveJump.ID}_${originID}`}, 
                T(origin.Description)
            )
        );
    }
    return form;

}

function renderAltFormScreen(panel){
    panel.replaceChildren();
    for (let j of Chain.Jumps){
        for (let form of j.PhysicalForms) {
            if(form.JumperID == DP.ActiveJumperID){
                panel.append(E("div", {class: "row"}, renderAltForm(form , false)) );        
            }
        }    
    }
    panel.append( E("div", 
        {class: "row"},
        E("div", {class:"central placeholder vcentered"}, T("No Alt-Forms Aquired!"))
        ));
}

function createCollapsingDivider(text, expanded = false, element = "div") {
    if (typeof(text) == "string") text = T(text);
    return E(element, {class:`collapsable row${(!expanded)?" collapsed":""}`, autocomplete: "off", onSubmit: "return false;",}, 
        E("div", {class: "central vcentered persistent label"}, 
            createIconButton((expanded)?"collapse":"expand", "small alt"), 
            text
        )
    );
}

function makeDragDroppabale (element, dragStart, dragEnd, drop){
    element.setAttribute("draggable", "true");
    element.addEventListener("dragenter", (e) => {
        e.preventDefault();
        if (e.currentTarget.contains(e.relatedTarget)) {
            return;
          }          
        element.classList.add("dragtarget");
    });

    element.addEventListener("dragover", (e) => {
        e.preventDefault();
    });

    element.addEventListener("dragleave", (e) => {
        e.preventDefault();
        if (e.currentTarget.contains(e.relatedTarget)) {
            return;
          }          
        element.classList.remove("dragtarget");
    });

    element.addEventListener("dragstart", dragStart);
    element.addEventListener("dragend", dragEnd);
    element.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        element.classList.remove("dragtarget");
        drop();
    });

}

function renderPersonalityPane(){
    let jumper = Chain.Characters[DP.ActiveJumperID];
    let personality = createCollapsingDivider("Personal Identity:", true, "form");
    personality.classList.add("highlightable");
    let editButton = createIconButton("edit", "smallish", {
        Form: personality, 
        Item: jumper, 
        FieldList: jumper.FieldList,
        IDPrefix: `${jumper.ID}`,
        Callback: () => {
            return renderPersonalityPane();
        }
    });
    let buttonRow = E("div", {class: "button_row"}, editButton);
    personality.append(buttonRow);
    let pane = E("div", {class: "tripart_row"}, 
        E("div", {}, 
            E("span", {class: "label"}, T("Personality:")), 
            E("div",  {
                id: `Personality_${jumper.ID}`,
                class: "userparagraph", 
                placeholder: `What is type of person is ${jumper.Name}? What are they like to be around?`
            }, T(jumper.Personality)
            ), 

        ), 
        E("div", {}, 
        E("span", {class: "label"}, T("Motivation:")), 
        E("div",  {
            id: `Motivation_${jumper.ID}`,
            class: "userparagraph", 
            placeholder: `Why does ${jumper.Name} jump? What purpose do they find for the many abilities they shall accumulate?`
        }, T(jumper.Motivation)
        ), 

    ), 
        E("div", {}, 
            E("div", {}, 
                E("span", {class: "label"}, T("Likes: ")), 
                E("span",  {
                    id: `Likes_${jumper.ID}`,
                    class: "userparagraph", 
                    placeholder: `What's at least one thing that ${jumper.Name} enjoys?`
                }, T(jumper.Likes)
            )), 
            E("div", {style:{marginTop:"0.5rem"}}, 
                E("span", {class: "label"}, T("Dislikes: ")), 
                E("span",  {
                    class: "userparagraph", 
                    id: `Dislikes_${jumper.ID}`,
                    placeholder: `At least one thing that ${jumper.Name} doesn't enjoy?`
                }, T(jumper.Dislikes)
            )), 
            E("div", {style:{marginTop:"0.5rem"}}, 
                E("span", {class: "label"}, T("Quirks: ")), 
                E("span",  {
                    id: `Quirks_${jumper.ID}`,
                    class: "userparagraph", 
                    placeholder: `At least one thing that makes ${jumper.Name} weird or unique?`
                }, T(jumper.Quirks)
            )), 
    ),
    );
    personality.append(pane);
    return personality;
}

function addReorderEventListeners(itemDOM, listItem, list, key = "Item"){
    makeDragDroppabale(itemDOM, 
        () => {DP[`Dragged${key}Index`] = list.indexOf(listItem); DP[`Dragged${key}`] = itemDOM}, 
        () => {delete DP[`Dragged${key}Index`]; delete DP[`Dragged${key}`];}, 
        () => {
            if (`Dragged${key}Index` in DP) {
                console.log(DP);
                let newI = 
                    (DP[`Dragged${key}Index`] < list.indexOf(listItem)) ? (list.indexOf(listItem)-1) : list.indexOf(listItem);
                list.splice(newI, 0, list.splice(DP[`Dragged${key}Index`], 1)[0]);
                itemDOM.parentNode.insertBefore(DP[`Dragged${key}`], itemDOM);                        
            }
        }
    );     
}

function renderJumpSwitchSidebar(panel, replace = false){
    let button = createIconButton("collapse", "persistent");
    button.classList.remove("button");

    let mainPanel = E("nav", {class: "panel_control collapsable", id: "jump_switch_sidebar"}, 
        E("h2", {class: "persistent"}, T("Jump List")), 
        button
    )
    let characterSelect = E("form", {class: "subpanel_select", autocomplete: "off", onSubmit: "return false;"}, 
        E("span", {class: "label"}, T("Character:"))
    );

    let select = E("select");
    for(let charID in Chain.Characters){
        let option = E("option", {value: charID}, 
            T(Chain.Characters[charID].Name)
        );
        if(charID == DP.ActiveJumperID) option.setAttribute("selected", "selected");
        select.append(option);
    }
    select.addEventListener("change", () => {
        DP.ActiveJumperID = select.value; 
        populateItineraryMainPanel();});
    characterSelect.append(select);

    let jumpGrid = E("div", {class: "tab_grid"});
    let activeTab;

    for(let i = 0; i < Chain.Jumps.length; i++){
        let jump = Chain.Jumps[i];
        let jumpNameNode = T(jump.Name);
        let jumpAvailable = jump.JumpedBy(DP.ActiveJumperID);
        jump.NameRender = jumpNameNode;
        let tab = E("a", {
            href: "#;",
            class: `tab${(jump.ID == DP.ActiveJump.ID)?" active":""}` 
               + `${(!jumpAvailable) ? " unavailable" : ""}`
            },
            E("span", {class: "label"}, 
                T((jump.ParentJumpID < 0) ? `${jump.JumpNumber}` : '')
            ),
            E("span", {class: (jump.ParentJumpID >= 0) ? "indented" : "", 
                placeholder: "[untitled jump]"}, jumpNameNode)
        );
        if(jump.ParentJumpID < 0) 
            makeDragDroppabale(tab, 
                () => {DP.DraggedJumpIndex = Chain.Jumps.indexOf(jump);}, 
                () => {delete DP.DraggedJumpIndex;}, 
                () => {
                    if("DraggedJumpIndex" in DP){
                        Chain.ReorderJumps(DP.DraggedJumpIndex, Chain.Jumps.indexOf(jump));
                    }
                    renderJumpSwitchSidebar(document.getElementById("jump_switch_sidebar"), true)
                }
            );
        else
            tab.setAttribute("draggable", "false");

        // if(jumpAvailable) 
            tab.addEventListener("click", () => {
                DP.ActiveJump = jump; 
                populateItineraryMainPanel();});

            if (jump.ID == DP.ActiveJump.ID) activeTab = tab;
            jumpGrid.append(tab);
        }

    mainPanel.append(characterSelect, jumpGrid);

    mainPanel.append(
        E("div", {class: "button_row"}, 
            createIconButton("delete", "alt", {Callback: () => {
                if (Chain.Jumps.length <= 1){
                    alert("Make another Jump before deleting this one!")
                    return;
                }
                let newJumpNum = Math.min(Chain.Jumps.length - 2, DP.ActiveJump.JumpNumber);
                DP.ActiveJump.Unregister();
                DP.ActiveJump = Chain.Jumps[newJumpNum];
                populateItineraryMainPanel();
                
            }}), 
            createIconButton("new", "alt",{Callback: () => {
                let j = new Jump();
                Chain.RegisterJump(j);
                DP.CurrentPanel = "Setting & Origin";
                DP.ActiveJump = j;
                document.getElementById("topnav");
                populateItineraryMainPanel();
                let newJumpGrid = document.getElementById("jump_switch_sidebar").querySelector(".tab_grid");
                newJumpGrid.scrollTop = newJumpGrid.scrollHeight;
                return document.getElementById("topnav");
            }})
        )
    );
    let scroll;
    if (!replace) {
        panel.append(mainPanel);
        scroll = DP.SidebarScroll;
    } else {
        scroll = panel.querySelector(".tab_grid").scrollTop;
        panel.replaceWith(mainPanel);
    }
    // jumpGrid.scrollTo(0, activeTab.offsetTop);
    jumpGrid.scrollTop = scroll;
}

function renderPassportSidebar(cache = false){
    let button = createIconButton("collapse", "persistent");
    button.classList.remove("button");

    update = cache ? populateCosmicCacheMainPanel : populateTravelerManifestMainPanel; 

    let mainPanel = E("nav", {class: "panel_control collapsable", id: "jumper_passport_sidebar"}, 
        E("h2", {class: "persistent"}, T("Passport")), 
        button
    )
    let characterSelect = E("form", {class: "subpanel_select", autocomplete: "off", onSubmit: "return false;"}, 
        E("span", {class: "label"}, T("Character:"))
    );

    let select = E("select");
    for(let charID in Chain.Characters){
        let option = E("option", {id: `character_name_${charID}`, value: charID}, 
            T(Chain.Characters[charID].Name)
        );
        if(charID == DP.ActiveJumperID) option.setAttribute("selected", "selected");
        select.append(option);
    }
    select.addEventListener("change", () => {
        DP.ActiveJumperID = select.value; 
        update();});
    characterSelect.append(select);

    mainPanel.append(characterSelect);

    let jumper = Chain.Characters[DP.ActiveJumperID];

    let passportPanel = E("div", {class: "passport"}, 
        E("div", {class:"label"}, T("True Age:")), T(displayAge(jumper.TrueAge)),
        E("div", {class:"label"}, T("Jumps Made:")), T(jumper.JumpsMade),
        E("div", {class:"label"}, T("Perks Aquired:")), T(jumper.PerkCount),
        E("div", {class:"label"}, T("Items Hoarded:")), T(jumper.ItemCount)
    );

    mainPanel.append(passportPanel);

    mainPanel.append(
        E("div", {class: "button_row"}, 
            createIconButton("delete", "alt", {Callback: () => {
                if (Object.keys(Chain.Characters).length <= 1){
                    alert("Make another character before deleting this one!");
                    return;
                }
                Chain.Characters[DP.ActiveJumperID].Unregister();
                DP.ActiveJumperID = Object.keys(Chain.Characters)[0];
                update();
                
            }}), 
            createIconButton("new", "alt",{Callback: () => {
                let j = new Jumper();
                j.Name = "[unnamed character]";
                Chain.RegisterCharacter(j);
                DP.CurrentPanel = "Overview";
                DP.ActiveJumperID = j.ID;
                update();
                return document.getElementById("topnav");
            }})
        )
    );


    return mainPanel;
}

function renderNarrativeSummaryScreen(panel) {
    panel.replaceChildren();
    for (let j of Chain.Jumps) {
        if (j.JumpedBy(DP.ActiveJumperID))
            panel.append(renderJumpNarrative(
                j.Narratives[DP.ActiveJumperID], Chain.Characters[DP.ActiveJumperID].Name, 
                j,
                (j.Name ? j.Name : "[untitled jump]") + ":")
            );
    }
}

function renderAltFormPanel(){
    let altFormRenders = [];
    for (let form of DP.ActiveJump.PhysicalForms) {
        if(form.JumperID == DP.ActiveJumperID){
            altFormRenders.push(
                renderAltForm(form , true)
                );        
        }
    }
    let altFormPanel = createCollapsingDivider("New Alt-Forms:", altFormRenders.length > 0);
    altFormPanel.append(...altFormRenders);

    let bottomRow = E("div", {class: "compact row"}, 
        E("div", {class:"central placeholder vcentered"}, T("No Alt-Forms Gained!"))
        );

    bottomRow.append(
        E("div", {class: "button_row"}, 
            createIconButton("new", "", {Callback: () => {
                let af = DP.ActiveJump.NewAltForm(DP.ActiveJumperID);
                let newRender = renderAltForm(af);
                altFormPanel.insertBefore(newRender, bottomRow);
                swapInInputs(newRender, af, af.FieldList, (form) => {
                    budgetUpdate(); return renderAltForm(form);
                }, `${DP.ActiveJump.ID}_${af.ID}`);
                return newRender;
            }})
        )
    );

    altFormPanel.append(bottomRow);

    return altFormPanel;

}

function renderAltForm(altForm, deletable = true, showName = true){
    let imperialUnits = localStorage.getItem("unitsImperial") == "true";

    let container = E("form", {class:"tripart_row highlightable", autocomplete: "off", onSubmit: "return false;"});

    let buttons = E("div", {class: "button_row"});
    
    if (deletable) 
        buttons.append(createIconButton("delete", "smallish", {Form: container, Item: altForm}));
    buttons.append(createIconButton("edit", "smallish", {
            Form: container,
            Item: altForm,
            FieldList: altForm.FieldList,
            Deletable: deletable, 
            IDPrefix: `${DP.ActiveJump.ID}_${altForm.ID}`,
            Callback: (item) => {
                budgetUpdate();
                return renderAltForm(item, deletable, showName);
            }
            
        })
    );

    let leftColumn = E("div", {class: "grid"});
    container.append(leftColumn);

    if(showName) leftColumn.append(
        E("div", {class: "label vcentered", style:{justifyContent: "right"}}, T("Name:")),
        E("div", {id:`Name_${DP.ActiveJump.ID}_${altForm.ID}`, class: "vcentered", 
            style:{gridColumn: "span 3"},
            placeholder: "[nameless body]"}, T(altForm.Name)));

    leftColumn.append(
        E("div", {class: "label vcentered", style:{justifyContent: "right"}}, T("Height:")),
        E("div", {class: "vcentered"},
            E("span", {id:`Height_${DP.ActiveJump.ID}_${altForm.ID}`}, T(displayHeight(altForm.Height))), 
            T(`\u00A0${(imperialUnits)? "in" : "cm"}`)
        ),
        E("div", {class: "label vcentered", style:{justifyContent: "right"}}, T("Sex:")),
        E("span", {id:`Sex_${DP.ActiveJump.ID}_${altForm.ID}`, class: "vcentered"}, T(altForm.Sex)),
        E("div", {class: "label vcentered", style:{justifyContent: "right"}}, T("Weight:")),
        E("div", {class: "vcentered"},
            E("span", {id:`Weight_${DP.ActiveJump.ID}_${altForm.ID}`}, T(altForm.Weight)),
            T(`\u00A0${(imperialUnits)? "lbs" : "kg"}`),
        ),
        E("div", {class: "label vcentered", style:{justifyContent: "right"}}, T("Species:")),
        E("span", {class: "vcentered", id:`Species_${DP.ActiveJump.ID}_${altForm.ID}`}, T(altForm.Species)),    
    ); 

    container.append(E("div", {},
        E("div", {
            class: "userparagraph stretch", 
            id: `PersonalDescription_${DP.ActiveJump.ID}_${altForm.ID}`, 
        }, 
            E("span", {class: "label"}, T("Personal Physique:")),
            E("div", {
                placeholder: `What does this form look like? It it tall or short? Young or old? Skinny or not?`
            }, T(altForm.PersonalDescription)
            )            
        ),
        E("div", {
            class: "userparagraph stretch", 
            id: `Capabilities_${DP.ActiveJump.ID}_${altForm.ID}`, 
        }, 
            E("div", {class: "label"}, T("Capabilities and Limitations:")),
            E("div", {
                placeholder: `What makes this form special on a practical level? What can it do or not do, relative to other forms?`
            }, T(altForm.Capabilities)
            )
        )

        ), 
        E("div", {},
        buttons

        )
    );
    return container;
}

function renderPurchaseSummaryScreen(panel, purchaseType, supplement = undefined){
    panel.replaceChildren();
    let searchContainer = E("div", {style: {display: "contents"}});
    let [filterBar, searchBar] = renderPurchaseFilterBar(purchaseType, (p) => {
        listPurchases(searchContainer, purchaseType, p, supplement);
    }, searchContainer, supplement);
    panel.append(filterBar);
    searchBar.focus();
    panel.append(searchContainer);
    
}


function renderJumpNarrative(narrative, JumperName, jump, sectionName = "Narrative Beats:", expand = undefined){
    let narrativePanel = createCollapsingDivider(sectionName,
        (expand === undefined) ? narrative.Goals || narrative.Challenges || narrative.Accomplishments : expand, "form");
    narrativePanel.classList.add("highlightable");
    narrativePanel.append(
        E("div", {class: "persistent button_row"},
            createIconButton("edit", "persistent smallish", {
                Form: narrativePanel, 
                Item: narrative, 
                FieldList: jump.FieldList,
                Deletable: false, 
                IDPrefix: `${DP.ActiveJumperID}`,
                Callback: (item, expand) => renderJumpNarrative(item, JumperName, jump, sectionName, expand)
            }),
        ),
        E("div", {class:"tripart_row"},
            E("div", {},
                E("div", {class: "label vcentered"}, T("Goals:")),
                E("div", {
                    class: "userparagraph", 
                    id: `Goals_${DP.ActiveJumperID}`, 
                    placeholder: `What does ${JumperName} hope to achieve here? What experiences are they looking for? What are their desires and needs?`
                }, 
                    T(narrative.Goals))
            ), 
            E("div", {},
                E("div", {class: "label vcentered"}, T("Challenges:")),
                E("div", {
                    class: "userparagraph", 
                    id: `Challenges_${DP.ActiveJumperID}`, 
                    placeholder: `Who gets in ${JumperName}'s way? What do they they have to overcome to get what they want? What surprises do they encounter?`
                }, 
                    T(narrative.Challenges))
            ), 
            E("div", {},
                E("div", {class: "label vcentered"}, T("Accomplishments:")),
                E("div", {
                    class: "userparagraph", 
                    id: `Accomplishments_${DP.ActiveJumperID}`,
                    placeholder: `What will ${JumperName} have accomplished when it's all said and done? What good and what evil will they have done to this world?`
                }, 
                    T(narrative.Accomplishments))
            )
        )
    );

    return narrativePanel;

}

function renderJumpMetadata() {
    let jumpdocLink;

    if (!DP.ActiveJump.URL)
        jumpdocLink = T("[missing]");
    else {
        jumpdocLink = E("a", {class: "naked_URL", 
            href: DP.ActiveJump.URL,
            target: "_blank"}, T(DP.ActiveJump.URL));
    }

    let supplementText;

    if (DP.ActiveJump.ParentJumpID < 0) 
        supplementText = T("No");
    else 
        supplementText = E("span", {class: ""}, 
            T(`Yes `),
            E("span", {class: "note"} , T(`(Parent: `), 
                E("span", {class: "sublabel"}, 
                    T(`${Chain.Jump(DP.ActiveJump.ParentJumpID).Name}`)
                ), T(`)`)
            )
        );
    
    let container = E("form", {autocomplete: "off", onSubmit: "return false;", class: "row"});
    let editButton =  createIconButton("edit", "small", {
        Form: container, 
        Item: DP.ActiveJump, 
        FieldList: DP.ActiveJump.FieldList,
        Deletable: false,
        IDPrefix: `${DP.ActiveJump.ID}`,
        Callback: (p) => {
            if (DP.ActiveJump.Supplement) {
                let s = false;
                for (let i = Chain.Jumps.indexOf(DP.ActiveJump) - 1; i >= 0; i--) {
                    if (Chain.Jumps[i].ParentJumpID < 0) {
                        DP.ActiveJump.ParentJumpID = Chain.Jumps[i].ID;
                        s = true; break;
                    }
                }
                if (!s) {
                    DP.ActiveJump.Supplement = false;
                    DP.ActiveJump.ParentJumpID = -1;
                } else {
                    for (let i = Chain.Jumps.indexOf(DP.ActiveJump) + 1; i < Chain.Jumps.length; i++) {
                        if (Chain.Jumps[i].ParentJumpID == DP.ActiveJump.ID) {
                            Chain.Jumps[i].ParentJumpID = DP.ActiveJump.ParentJumpID;
                        } else {
                            break;
                        }
                    }
                }
            } else if (DP.ActiveJump.ParentJumpID >= 0){
                DP.ActiveJump.ParentJumpID = -1;
                let i;
                for (i = Chain.Jumps.indexOf(DP.ActiveJump); i < Chain.Jumps.length - 1; i++) {
                    if (Chain.Jumps[i + 1].ParentJumpID < 0) break;
                }
                Chain.Jumps.splice(i, 0, ...Chain.Jumps.splice(Chain.Jumps.indexOf(DP.ActiveJump), 1));
            }
            budgetUpdate();
            renderJumpSwitchSidebar(document.getElementById("jump_switch_sidebar"), true);
            return renderJumpMetadata(p);
        }
    });

    container.append(
        E("div", {class: "central label"}, T("Jump Info:"), editButton),
        E("div"),
        E("span", {class: "label vcentered", style: {justifyContent: "right"}}, T("Length: ")), 
        E("span", {}, 
            E("span", {id: `Length_Years_${DP.ActiveJump.ID}`}, T(DP.ActiveJump.Length.Years)),
            T(" Years, "), 
            E("span", {id: `Length_Months_${DP.ActiveJump.ID}`}, T(DP.ActiveJump.Length.Months)),
            T(" Months, & "), 
            E("span", {id: `Length_Days_${DP.ActiveJump.ID}`}, T(DP.ActiveJump.Length.Days)),
            T(" Days") 
        ),  E("div"),
        E("span", {class: "label vcentered", style: {justifyContent: "right"}}, T("URL:")), 
        E("span", {id: `URL_${DP.ActiveJump.ID}`}, 
            jumpdocLink), E("div"),
        E("span", {class: "label vcentered", style: {justifyContent: "right"}}, T("Drawback Exclusions:")), 
        E("span", {id: `ExcludedDrawbacks_${DP.ActiveJump.ID}`},
            T(DP.ActiveJump.ExcludedDrawbacks.length > 0 ? "Some" : "None")), E("div"),    
        E("span", {class: "label vcentered", style: {justifyContent: "right"}}, T("Supplement:")), 
        E("span", {id: `Supplement_${DP.ActiveJump.ID}`}, 
            supplementText), 
    )
    return container;
}

function renderSubtypeConfiguration(budgetbar){
    return new ComplexConfigMenu("Purchase Subtypes:", 
    {
        Name: {InputType: "text", DataType: "String"}, 
        Type: {InputType: "select", Options: [
            {Text: "Perk", Value: PurchaseTypes.Perk}, 
            {Text: "Item", Value: PurchaseTypes.Item}, 
        ]}, 
        Subsystem: {InputType: "checkbox", DataType: "Boolean"}, 
        Stipend: {InputType: "number", DataType: "Integer", Step: 50}, 
        Currency: {InputType: "select", Options: 
            Object.entries(DP.ActiveJump.Currencies).map( ([cID, c]) => 
                {return {Text: c.Abbrev, Value: cID};} )}, 
    }
    , DP.ActiveJump.PurchaseSubTypes, 
    () => {
        let newSubtype = {
            Name: "[new]", 
            Stipend: 0, 
            Currency: "0",
            Subsystem: false,
            Type: PurchaseTypes.Perk
        };
        DP.ActiveJump.PurchaseSubTypes.push(newSubtype);
        let newbudgetbar = renderBudgetBar();
        budgetbar.replaceWith(newbudgetbar);
        budgetbar = newbudgetbar;
        return DP.ActiveJump.PurchaseSubTypes.length - 1;
        
    },
    (item) => {
        let i = DP.ActiveJump.PurchaseSubTypes.indexOf(item);
        DP.ActiveJump.PurchaseSubTypes.splice(i, 1);

        let replacementSubtype;
        for (let st in DP.ActiveJump.PurchaseSubTypes){
            if (DP.ActiveJump.PurchaseSubTypes[st].Type == item.Type) 
                replacementSubtype = st;
        }

        if (i.Subsystem) {
            for (let j of Chain.Characters){
                if (i in DP.ActiveJump.SubsystemAccess[j.ID][i])
                    delete DP.ActiveJump.SubsystemAccess [j.ID][i];
            }
        }

        for (let j = 0; j < DP.ActiveJump.Purchases.length; j++) {
            let p = DP.ActiveJump.Purchases[j];
            if (p.Subtype == i) {
                if (i.Subsystem) {p.Unregister(); j--; continue;}
                p.Subtype = replacementSubtype; continue;
            }
            if (p.Type == PurchaseTypes.Companion) {
                for (let c in DP.ActiveJump.Currencies){
                    if (i in p.Stipends[c]) 
                        delete p.Stipends[c][i];
                }
            }
        }
        budgetUpdate();
    },
    () => {
        document.getElementById("main_panel_tabs").replaceWith(
            renderItineraryTabs(document.getElementById("main_content_panel"), false)
        );
        budgetUpdate();
    });
}

function renderJumpConfigScreen(panel){

    panel.replaceChildren();

    let budgetbar = renderBudgetBar();

    panel.append(budgetbar);

    let bottomMenu = E("div", {class: "flexrow"});

    let subtypeConfiguration = renderSubtypeConfiguration(budgetbar);

    let originCategoryCustomization = new ComplexConfigMenu("Background Aspects:", 
    {
        Name: {InputType: "text", DataType: "String"}, 
        Single: {InputType: "checkbox", DataType: "Boolean", Placeholder: "Single Line"}, 
    }
    , DP.ActiveJump.OriginCategories, 
    () => {
        let newOriginCat = {
            Name: "[new]", 
            Single: "true", 
            Def: ""
        };
        return DP.ActiveJump.AddOriginCategory(newOriginCat);
    },
    (item) => {
        DP.ActiveJump.RemoveOriginCategory(item);
        budgetUpdate();
    }, 
    budgetUpdate);


    let currencyCustomization = new ComplexConfigMenu("Currencies:", 
        {
            Name: {InputType: "text", DataType: "String"}, 
            Abbrev: {InputType: "text", DataType: "String"}, 
            Budget: {InputType: "number", DataType: "Integer", Step: 50}, 
        }
    , DP.ActiveJump.Currencies, 
        () => {
            let newCurrency = {
                Name: "[new currency]", 
                Abbrev: "[NC]", 
                Budget: 0
            };
            let c = DP.ActiveJump.AddCurrency(newCurrency);
            let newbudgetbar = renderBudgetBar();
            budgetbar.replaceWith(newbudgetbar);
            budgetbar = newbudgetbar;
            return c;
        },
        (c) => {
            DP.ActiveJump.RemoveCurrency(c);
            let newbudgetbar = renderBudgetBar();
            budgetbar.replaceWith(newbudgetbar);
            budgetbar = newbudgetbar;
        },
        () => {
            let newConfig = renderSubtypeConfiguration(budgetbar);
            subtypeConfiguration.DOM.replaceWith(newConfig.DOM);
            subtypeConfiguration = newConfig;
            let newbudgetbar = renderBudgetBar();
            budgetbar.replaceWith(newbudgetbar);
            budgetbar = newbudgetbar;
        });

    panel.append(renderJumpMetadata());
    bottomMenu.append(originCategoryCustomization.DOM);
    bottomMenu.append(currencyCustomization.DOM);
    bottomMenu.append(subtypeConfiguration.DOM);
    panel.append(bottomMenu);
}

function renderJumpOverview(panel){
    panel.replaceChildren();

    panel.append(renderBudgetBar());

    for(let originID in DP.ActiveJump.OriginCategories){
        panel.append(
            renderOriginCategory(DP.ActiveJump.Origins[DP.ActiveJumperID][originID], originID)
        );
    }

    panel.append(E("div", {class:"hrule"}));
  
    if (Chain.AltFormSetting == ChainSettings.YesAltForms)
        panel.append(renderAltFormPanel());

    if (Chain.NarrativeSetting == ChainSettings.YesNarratives
        || ((Chain.NarrativeSetting == ChainSettings.PrimaryNarrativesOnly) && Chain.Characters[DP.ActiveJumperID].Primary))
        panel.append(
            renderJumpNarrative(DP.ActiveJump.Narratives[DP.ActiveJumperID], 
                Chain.Characters[DP.ActiveJumperID].Name, DP.ActiveJump)
            );

}

function renderItineraryTabs(contentPanel, render = true) {

    let pages = [
        {Name: "Setting & Origin", Render: renderJumpOverview}, 
        {Name: "Perks", Render: 
            (panel) => renderPurchaseScreen(panel, PurchaseTypes.Perk)},
        {Name: "Items", Render:
            (panel) => renderPurchaseScreen(panel, PurchaseTypes.Item)}
    ];

    if ( (Chain.Characters[DP.ActiveJumperID].Primary && Chain.CompanionSetting == ChainSettings.YesCompanions) 
    || Chain.CompanionSetting == ChainSettings.ExponentialCompanions) {
        pages.push({
            Name: "Companions", Render: 
            (panel) => renderPurchaseScreen(panel, PurchaseTypes.Companion),
        })
    }

    pages.push(
        {Name: "Drawbacks & Scenarios", Render: renderDrawbackScreen},
    );


    if("CurrentPanel" in DP == false) DP.CurrentPanel = pages[0].Name;

    for (let st in DP.ActiveJump.PurchaseSubTypes){
        if (!DP.ActiveJump.PurchaseSubTypes[st].Subsystem) continue;
        pages.push({
            Name: DP.ActiveJump.PurchaseSubTypes[st].Name, 
            Render: (panel) => renderSubsystemScreen(panel, st)});
    }

    for (let supp of Chain.Supplements){
        pages.push({
            Name: supp.Name, 
            Render: (panel) => renderSupplementScreen(panel, supp)});
    }

    pages.push({Name: "Config", Render: renderJumpConfigScreen});

    let tabs = E("nav", {class:"tabs", id: "main_panel_tabs"});
    let panelIndex = 0;

    for (let i in pages) {
        if (pages[i].Name == DP.CurrentPanel) {panelIndex = i; break;}
    }
    if (panelIndex == 0) DP.CurrentPanel = pages[0].Name;

    for (let i in pages) {
        let tab = E("a", {href: "#;"}, T(pages[i].Name));
        tab.addEventListener("click", () => {
            DP.ActiveTab.classList.remove("active");
            tab.classList.add("active");
            DP.ActiveTab = tab;
            DP.CurrentPanel = pages[i].Name;
            pages[i].Render(contentPanel);
        });
        if (pages[i].Name == DP.CurrentPanel) DP.ActiveTab = tab;
        tabs.append(tab);
    }

    DP.ActiveTab.classList.add("active");

    if (render) pages[panelIndex].Render(contentPanel);

    return tabs;

}

function populateItineraryMainPanel(reset = false){


    document.getElementById("upper_nav").querySelector(".active").classList.remove("active");
    document.getElementById("itinerary_tab").classList.add("active");
 
    if (reset) DP = {};
    if("ActiveJump" in DP == false) DP.ActiveJump = Chain.Jumps[0];
    if("ActiveJumperID" in DP == false) DP.ActiveJumperID = Object.keys(Chain.Characters)[0];
    
    DP.SidebarScroll = document.getElementById("jump_switch_sidebar") 
        ? document.getElementById("jump_switch_sidebar").querySelector(".tab_grid").scrollTop : 0;

    main = document.getElementById("main");
    main.replaceChildren();
    renderJumpSwitchSidebar(main);
    mainPanel = E("main", {class:"neutral_container"});

    let contentPanel = E("div", {class:"panel", id: "main_content_panel"});
    let tabs = renderItineraryTabs(contentPanel);

    mainPanel.append(tabs, contentPanel);

    main.append(mainPanel);

}

function renderJumperOverview(panel){
    panel.replaceChildren();

    let jumper = Chain.Characters[DP.ActiveJumperID];

    panel.append(renderJumperCharacteristic("Name"));
    panel.append(renderJumperCharacteristic("Gender"));
    panel.append(renderJumperCharacteristic("OriginalAge", "Original Age"));
    panel.append(renderJumperCharacteristic("OriginalBackground", "Background"));
    panel.append(renderJumperCharacteristic("Primary", "Character Type"));

    panel.append(E("div", {class:"hrule"}));

    let originalForm = createCollapsingDivider("Original Body:", true);
    originalForm.append(renderAltForm(jumper.OriginalForm, false, false));


    panel.append(originalForm, renderPersonalityPane());

}

function populateTravelerManifestMainPanel(reset = false){


    document.getElementById("upper_nav").querySelector(".active").classList.remove("active");
    document.getElementById("traveler_manifest_tab").classList.add("active");

    if (reset) DP = {};
    if("ActiveJump" in DP == false) DP.ActiveJump = Chain.Jumps[0];
    if("ActiveJumperID" in DP == false) DP.ActiveJumperID = Object.keys(Chain.Characters)[0];

    main = document.getElementById("main");
    main.replaceChildren();
    mainNav = renderPassportSidebar();
    mainPanel = E("main", {class:"neutral_container"});


    let pages = [
        {Name: "Overview", Render: renderJumperOverview}, 
        {Name: "Perk List", Render: 
        (panel) => renderPurchaseSummaryScreen(panel, PurchaseTypes.Perk)},
    ];
    if (Chain.AltFormSetting == ChainSettings.YesAltForms) {
        pages.push({Name: "Alt-Forms", Render: renderAltFormScreen});
    }


    if("CurrentPanel" in DP == false) DP.CurrentPanel = pages[0].Name;

    for (let supp of Chain.Supplements){
        if (supp.ItemLike) continue;
        pages.push({
            Name: supp.Name, 
            Render: (panel) => renderPurchaseSummaryScreen(panel, PurchaseTypes.Supplement, supp)});
    }

    if (Chain.NarrativeSetting == ChainSettings.YesNarratives
        || ((Chain.NarrativeSetting == ChainSettings.PrimaryNarrativesOnly) && Chain.Characters[DP.ActiveJumperID].Primary))
        pages.push({Name: "Narrative Summary", Render: renderNarrativeSummaryScreen});

    let panelIndex = 0;
    for (let i in pages) {
        if (pages[i].Name == DP.CurrentPanel) {panelIndex = i; break;}
    }
    if (panelIndex == 0) DP.CurrentPanel = pages[0].Name;

    let tabs = E("nav", {class:"tabs"});
    let contentPanel = E("div", {class:"panel"});

    for (let i in pages) {
        let tab = E("a", {href: "#;"}, T(pages[i].Name));
        tab.addEventListener("click", () => {
            DP.ActiveTab.classList.remove("active");
            tab.classList.add("active");
            DP.ActiveTab = tab;
            DP.CurrentPanel = pages[i].Name;
            pages[i].Render(contentPanel);
        });
        if (i == panelIndex) DP.ActiveTab = tab;
        tabs.append(tab);
    }

    DP.ActiveTab.classList.add("active");
    pages[panelIndex].Render(contentPanel);

    mainPanel.append(tabs, contentPanel);

    main.append(mainNav, mainPanel);

}

function populateCosmicCacheMainPanel(reset = false){


    document.getElementById("upper_nav").querySelector(".active").classList.remove("active");
    document.getElementById("cosmic_cache_tab").classList.add("active");

    if (reset) DP = {};
    if("ActiveJump" in DP == false) {DP.ActiveJump = Chain.Jumps[0]};
    if("ActiveJumperID" in DP == false) DP.ActiveJumperID = Object.keys(Chain.Characters)[0];

    main = document.getElementById("main");
    main.replaceChildren();
    mainNav = renderPassportSidebar(true);
    mainPanel = E("main", {class:"neutral_container"});


    let pages = [
        {Name: "Item List", Render: (panel) => renderPurchaseSummaryScreen(panel, PurchaseTypes.Item)}, 
    ];

    if("CurrentPanel" in DP == false) DP.CurrentPanel = pages[0].Name;

    for (let supp of Chain.Supplements){
        if (!supp.ItemLike) continue;
        pages.push({
            Name: supp.Name, 
            Render: (panel) => renderPurchaseSummaryScreen(panel, PurchaseTypes.Supplement, supp)});
    }

    let panelIndex = 0;
    for (let i in pages) {
        if (pages[i].Name == DP.CurrentPanel) {panelIndex = i; break;}
    }
    if (panelIndex == 0) DP.CurrentPanel = pages[0].Name;

    let tabs = E("nav", {class:"tabs"});
    let contentPanel = E("div", {class:"panel"});

    for (let i in pages) {
        let tab = E("a", {href: "#;"}, T(pages[i].Name));
        tab.addEventListener("click", () => {
            DP.ActiveTab.classList.remove("active");
            tab.classList.add("active");
            DP.ActiveTab = tab;
            DP.CurrentPanel = pages[i].Name;
            pages[i].Render(contentPanel);
        });
        if (i == panelIndex) DP.ActiveTab = tab;
        tabs.append(tab);
    }

    DP.ActiveTab.classList.add("active");

    mainPanel.append(tabs, contentPanel);
    main.append(mainNav, mainPanel);
    pages[panelIndex].Render(contentPanel);


}

function renderBankingPanel(){
    let balance = Chain.CalculateBankBalance(DP.ActiveJump, DP.ActiveJumperID);
    let maxDeposit = DP.ActiveJump.AvailableDeposit(DP.ActiveJumperID);
    let maxWithdrawl = -balance;
    
    let depositInput = E("input", {type:"number", step: 50});
    depositInput.value = DP.ActiveJump.BankDeposits[DP.ActiveJumperID];

    let balanceDOM = T(`${balance + 
        ((depositInput.value > 0) ? (Chain.Bank.DepositRatio / 100) : 1) * depositInput.value}`);

    depositInput.addEventListener("input", () => {
        depositInput.value = Math.max(maxWithdrawl, Math.min(depositInput.value, maxDeposit));
        let deposit = Math.floor(depositInput.value);
        DP.ActiveJump.BankDeposits[DP.ActiveJumperID] = deposit;
        let newBalance = balance + ((deposit > 0) ? (Chain.Bank.DepositRatio / 100) : 1) * deposit;
        balanceDOM.nodeValue = `${newBalance}`;
        budgetUpdate();
    });

    return E("div", {class: "row"}, 
        E("span", {class: "label"}, T(`Bank Balance: `)), 
        balanceDOM, 
        E("div"),
        E("span", {class: "label"}, T(`Deposit / Withdrawal: `)),
        depositInput 
    );
}

function renderBankSettings(){
    let form = E("form", {style:{display: "contents"}});
    let editButton = createIconButton("edit", "small", {
        Form: form, 
        Item: Chain.Bank, 
        FieldList: Chain.BankFieldList,
        IDPrefix: `Bank`,
        Callback: () => {
            return renderBankSettings();
        }
    });
    form.append(
        E("span", {class: "label stretch", style:{justifyContent: "start"}}, T("Bank:"), editButton),
        E("span", {class: "sublabel vcentered"}, T("Enabled:")),
            E("span", {id: "Enabled_Bank"}, T(Chain.Bank.Enabled ? "Enabled" : "Disabled")),
        E("span", {class: "sublabel vcentered"}, T("Max Deposit:")),
        E("span", {class: ""}, 
            E("span", {id: "MaxDeposit_Bank"}, T(`${Chain.Bank.MaxDeposit}`)),
            T(` CP`),
        ),
        E("span", {class: "sublabel vcentered"}, T("Deposit Ratio:")),
        E("span", {class: ""}, 
            T(`100 CP :\u00A0`),
            E("span", {id: "DepositRatio_Bank"}, T(`${Chain.Bank.DepositRatio}`)),
        ),
        E("span", {class: "sublabel vcentered"}, T("Interest Rate:")),
        E("span", {class: ""}, 
            E("span", {id: "InterestRate_Bank"}, T(`${Chain.Bank.InterestRate}`)),
            T(`%`),
        ),
    );
    return form;
}

function renderChainSettingsScreen(panel) {
    
    panel.replaceChildren();

    let topMenu = E("div", {class: "flexrow"});

    let basicSettings = E("div", {class: "two_column_grid"});
    
    let companionSetting = new CheckBoxSelect("Companion Setting", true);
    companionSetting.AddOption("The Long Lonesome Road", 
        ChainSettings.NoCompanions, Chain.CompanionSetting == ChainSettings.NoCompanions,
        "You may not import any companions.");
    companionSetting.AddOption("Accompanied", 
        ChainSettings.YesCompanions, Chain.CompanionSetting == ChainSettings.YesCompanions, 
        "You may import companions as you wish. Companions may not import other companions.");
    companionSetting.AddOption("Exponential Growth", 
        ChainSettings.ExponentialCompanions, Chain.CompanionSetting == ChainSettings.ExponentialCompanions, 
        "You may import companions as you wish, who may also import companions as they wish, ad infinitum.");

    companionSetting.addInputListener( () => {
        Chain.CompanionSetting = companionSetting.value;
    });

    let altFormSetting = new CheckBoxSelect("Alt-Form Setting", true);
    altFormSetting.AddOption("Enabled", 
        ChainSettings.YesAltForms, Chain.AltFormSetting == ChainSettings.YesAltForms);
    altFormSetting.AddOption("Disabled", 
        ChainSettings.NoAltForms, Chain.AltFormSetting == ChainSettings.NoAltForms);

    altFormSetting.addInputListener( () => {
        Chain.AltFormSetting = altFormSetting.value;
    });

    let narrativeSettings = new CheckBoxSelect("Alt-Form Setting", true);
    narrativeSettings.AddOption("Tell a Story", 
        ChainSettings.YesNarratives, Chain.NarrativeSetting == ChainSettings.YesNarratives, 
        "Provides space for short blurbs summarizing each Jump.");
    narrativeSettings.AddOption("Main Character Syndrome", 
        ChainSettings.PrimaryNarrativesOnly, Chain.NarrativeSetting == ChainSettings.PrimaryNarrativesOnly, 
        "Provides space for narrative summaries for primary Jumper(s) only, but not for companions.");
    narrativeSettings.AddOption("Purely Mechanical", 
        ChainSettings.NoNarratives, Chain.NarrativeSetting == ChainSettings.NoNarratives, 
        "No space provided for narrative blurbs.");

        narrativeSettings.addInputListener( () => {
        Chain.NarrativeSetting = narrativeSettings.value;
    });

    basicSettings.append (
        E("span", {class: "label stretch", style:{justifyContent: "start"}}, T("Core Features:")),
        E("span", {class: "sublabel vcentered"}, T("Companions:")),
        companionSetting.DOM, 
        E("span", {class: "sublabel vcentered"}, T("Alt-Forms:")),
        altFormSetting.DOM, 
        E("span", {class: "sublabel vcentered"}, T("Narratives:")),
        narrativeSettings.DOM, 
        renderBankSettings()
    );

    let perkCategorySelect = new ComplexConfigMenu("Perk Categories:", 
        {Name: {InputType: "text", DataType: String}}, 
        Chain.PurchaseCategories[PurchaseTypes.Perk], 
        () => {
            Chain.PurchaseCategories[PurchaseTypes.Perk].push({Name: "[new category]"});
            return Chain.PurchaseCategories[PurchaseTypes.Perk].length - 1;
        },
        (item) => {
            Chain.PurchaseCategories[PurchaseTypes.Perk].splice(
                Chain.PurchaseCategories[PurchaseTypes.Perk].findIndex((c) => (c.Name == item.Name)), 1
            );
        }, 
        (item, change) => {
            for (let j of Chain.Jumps) {
                for (let p of j.Purchases) {
                    if (p.Type == PurchaseTypes.Supplement) continue;
                    let i = p.Category.indexOf(change.Name);
                    if (i >= 0) {
                        p.Category[i] = item.Name;
                    }
                }
            }
        }
    );

    let itemCategorySelect = new ComplexConfigMenu("Item Categories:", 
    {Name: {InputType: "text", DataType: String}}, 
    Chain.PurchaseCategories[PurchaseTypes.Item], 
    () => {
        Chain.PurchaseCategories[PurchaseTypes.Item].push({Name: "[new category]"});
        return Chain.PurchaseCategories[PurchaseTypes.Item].length - 1;
    },
    (item) => {
        Chain.PurchaseCategories[PurchaseTypes.Item].splice(
            Chain.PurchaseCategories[PurchaseTypes.Item].findIndex((c) => (c.Name == item.Name)), 1
        );
    }, 
    (item, change) => {
        for (let j of Chain.Jumps) {
            for (let p of j.Purchases) {
                if (p.Type == PurchaseTypes.Supplement) continue;
                let i = p.Category.indexOf(change.Name);
                if (i >= 0) {
                    p.Category[i] = item.Name;
                }
            }
        }
    }
    );

    topMenu.append(basicSettings);
    topMenu.append(perkCategorySelect.DOM, itemCategorySelect.DOM)
    panel.append(topMenu);

}

function renderChainSupplement(supp){
    let panel = E("form", {style: {display: "contents"}, autocomplete: "off", onSubmit: "return false;"});
    let editButton = createIconButton("edit", "small", {
        Form: panel, 
        Item: supp, 
        FieldList: supp.FieldList,
        Deletable: true,
        IDPrefix: `${supp.ID}`,
        Callback: (s) => {
            return renderChainSupplement(s);
        }
    });

    let deleteButton = createIconButton("delete", "small", {Form: panel, Item: supp});

    let companionAccess;

    let jumpdocLink;
    if (!supp.URL)
        jumpdocLink = T("[missing]");
    else {
        jumpdocLink = E("a", {class: "naked_URL", 
            href: supp.URL,
            target: "_blank"}, T(supp.URL));
    }

    if(supp.CompanionAccess == CompanionAccess.Communal)
        companionAccess = "Purchases shared between Jumper and companions";
    if(supp.CompanionAccess == CompanionAccess.Available)
        companionAccess = "Available to companions";
    if(supp.CompanionAccess == CompanionAccess.Unavailable)
        companionAccess = "Restricted to primary Jumper(s)";

    let categorySelect = new ComplexConfigMenu("Purchase Categories:", 
        {Name: {InputType: "text", DataType: String}}, 
        supp.PurchaseCategories, 
        () => {
            supp.PurchaseCategories.push({Name: "[new category]"});
            return supp.PurchaseCategories.length - 1;
        },
        (item) => {
            supp.PurchaseCategories.splice( supp.PurchaseCategories.findIndex((c) => (c.Name == item.Name)), 1 );
        }, 
        (item, change) => {
            for (let j of Chain.Jumps) {
                for (let p of j.Purchases) {
                    if (!p.Supplement || p.Supplement.ID != supp.ID) continue;
                    let i = p.Category.indexOf(change.Name);
                    if (i >= 0) {
                        p.Category[i] = item.Name;
                    }
                }
            }
        }
        );

    panel.append(
        E("div", {class: "row split"},
            E("span", {class: "label central"}, 
                E("span", {id: `Name_${supp.ID}`}, T(supp.Name)), 
                E("span", {style: {marginLeft: "auto"}}, deleteButton, editButton)
            ),
            E("span", {class: "vcentered label", style: {justifyContent: "right", gridColumn: "1"}}, T("Type:")), 
            E("span", {class: "vcentered central", id: `ItemLike_${supp.ID}`} ,
                T( (supp.ItemLike) ? "Item Supplement" : "Perk Supplement" )
            ),
            E("span", {class: "vcentered label", style: {justifyContent: "right", gridColumn: "1"}}, T("URL:")), 
            E("span", {class: "vcentered central", id: `URL_${supp.ID}`} ,
                jumpdocLink
            ),
            E("span", {class: "vcentered label", style: {justifyContent: "right", gridColumn: "1"}}, T("Companion Access:")), 
            E("span", {id: `CompanionAccess_${supp.ID}`} ,
                T(companionAccess)
            ),
            E("span", {class: "vcentered label", style: {justifyContent: "right", gridColumn: "1"}}, T("Currency Abbrev:")),
            E("span", {id: `Currency_${supp.ID}`} ,
                T(supp.Currency)
            ),
            E("div", {class: "central note"}, 
                E("span", {class: "sublabel"}, T("Initial Stipend:\u00A0")), 
                E("span", {}, 
                    E("span", {id: `InitialStipend_${supp.ID}`}, T(supp.InitialStipend)), 
                    T(`\u00A0${supp.Currency}`)
                )
            ),
            E("div", {class: "central note"}, 
                E("span", {class: "sublabel"}, T("Stipend Per Jump:\u00A0")), 
                E("span", {}, 
                    E("span", {id: `PerJumpStipend_${supp.ID}`}, T(supp.PerJumpStipend)), 
                    T(`\u00A0${supp.Currency}`)
                )
            ), 
            E("div", {class: "central note"}, 
                E("span", {class: "sublabel"}, T("Max Investment Per Jump:\u00A0")), 
                E("span", {}, 
                    E("span", {id: `MaxInvestment_${supp.ID}`}, T(supp.MaxInvestment)), 
                    T("\u00A0CP")
                )
            ),
            E("div", {class: "central note"}, 
                E("span", {class: "sublabel"}, T("Investment Ratio:\u00A0")), 
                E("span", {}, 
                    T("100 CP to "),
                    E("span", {id: `InvestmentRatio_${supp.ID}`}, T(supp.InvestmentRatio)), 
                    T(`\u00A0${supp.Currency}`)
                )
            ), 
            categorySelect.DOM
            
        )
    );
    panel.append(E("div", {class: "hrule"}));
    return panel;
}

function renderChainSupplementScreen(panel) {
    panel.replaceChildren();
    for (let supp of Chain.Supplements) {
        panel.append(renderChainSupplement(supp));
    }
    let bottomRow = E("div", {class: "row"}, 
        E("div", {class:"central placeholder vcentered"}, T("No Supplements!"))
    );
    let newPurchase = E("div", {class: "button_row"}, 
        createIconButton("new", "", { Callback: () => {
            let s = new ChainSupplement();
            Chain.RegisterSupplement(s);
            let newRender = renderChainSupplement(s);
            panel.insertBefore(newRender, bottomRow);
            swapInInputs(newRender, s, s.FieldList, (supp) => {
                return renderChainSupplement(supp);
            }, `${s.ID}`);
            return newRender;
        }})
    );
    bottomRow.append(newPurchase);
    panel.append(bottomRow);

}

function renderNote(item, i){
    let cell = E("div", {class: "cell"});
    let editButton =  createIconButton("edit", "smallish", {
        Form: cell, 
        Item: item, 
        FieldList: item.FieldList,
        IDPrefix: `${i}`,
        Callback: (item) => {
            return renderNote(item, i);
        }
    });

    let deleteButton = createIconButton("delete", "smallish", {Form: cell, Item: item});

    cell.append(
        E("div", {class: "cellhead"}, 
            E("span", {class: "label", id: `Title_${i}`}, T(item.Title)), 
        ), 
        E("div", {class:"userparagraph", id: `Text_${i}`}, T(item.Text)), 
        E("div", {class: "button_row"}, deleteButton, editButton)
    )
    return cell;

}

function renderNotesScreen(panel) {
    panel.replaceChildren();
    
    let tripartGrid = E("div", {class: "tripart_grid"});

    for (let i in Chain.HouseRules){
        tripartGrid.append(renderNote(Chain.HouseRules[i], i));
    }

    let finalCell = E("div", {class: "cell"});

    let newButton = createIconButton("new", "", { Callback: () => {
        let n = new Note("[untitled note]", "");
        Chain.HouseRules.push(n);
        let i = Chain.HouseRules.length - 1;
        let newRender = renderNote(n, i);
        tripartGrid.insertBefore(newRender, finalCell);
        swapInInputs(newRender, n, n.FieldList, (note) => {
            return renderNote(note, i);
        }, `${i}`);
        return newRender;
    }});

    finalCell.append(newButton);
    tripartGrid.append(finalCell);
    panel.append(tripartGrid);
}

function populateChainFeaturesMainPanel(reset = false){

    document.getElementById("upper_nav").querySelector(".active").classList.remove("active");
    document.getElementById("chain_features_tab").classList.add("active");

    main = document.getElementById("main");
    main.replaceChildren();
    mainPanel = E("main", {class:"neutral_container"});

    let pages = [
        {Name: "Settings", Render: renderChainSettingsScreen},
        {Name: "Supplements", Render: renderChainSupplementScreen},  
        {Name: "Chain Drawbacks", Render: renderChainDrawbackScreen},
        {Name: "Houserules & Notes", Render: renderNotesScreen} 
    ];

    if("CurrentPanel" in DP == false) DP.CurrentPanel = pages[0].Name;

    let panelIndex = 0;
    for (let i in pages) {
        if (pages[i].Name == DP.CurrentPanel) {panelIndex = i; break;}
    }
    if (panelIndex == 0) DP.CurrentPanel = pages[0].Name;

    let tabs = E("nav", {class:"tabs"});
    let contentPanel = E("div", {class:"panel"});

    for (let i in pages) {
        let tab = E("a", {href: "#;"}, T(pages[i].Name));
        tab.addEventListener("click", () => {
            DP.ActiveTab.classList.remove("active");
            tab.classList.add("active");
            DP.ActiveTab = tab;
            DP.CurrentPanel = pages[i].Name;
            pages[i].Render(contentPanel);
        });
        if (i == panelIndex) DP.ActiveTab = tab;
        tabs.append(tab);
    }

    DP.ActiveTab.classList.add("active");
    pages[panelIndex].Render(contentPanel);

    mainPanel.append(tabs, contentPanel);

    main.append(E("nav", {class: "panel_control"}), mainPanel);
}