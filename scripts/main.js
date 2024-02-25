let chainDataURL;
let autosave;
let secondsBetweenAutosaves = 60;

let accessKeys = undefined;
let serverAddress = "https://chainmaker.design";
let lastSavedChainDump = "";
let editRaceDetected = false;
let editID;

function saveLocally() {
    localStorage.setItem("chainDump", JSON.stringify(Chain));
    localStorage.setItem("unusedID", unusedID); 
}

async function saveToCloud() {
    if (!accessKeys || lastSavedChainDump.length == 0) {
        let chainDump = JSON.stringify([unusedID, Chain]);
        const response = await fetch(`${serverAddress}/request/new`, {
            method: "POST", 
            mode: "same-origin",
            cache: "no-cache", 
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({chainDump: chainDump})
        });
        if (response.status != "200") throw Error("Save Failed. Status: " + response.status, {cause: response.statusText});
        editID = 0;
        lastSavedChainDump = chainDump;
        accessKeys = await response.json();
    } else if (!editRaceDetected){
        let diffs = getDiff(JSON.parse(lastSavedChainDump), [unusedID, Chain]);
        if (Object.keys(diffs).length > 0) {
            let response = await fetch(`${serverAddress}/request/edit/${accessKeys.Edit}`, {
                method: "POST", 
                mode: "same-origin",
                cache: "no-cache", 
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({editID: editID, diff: diffs})
            });
            if (response.status != "200") throw Error("Load Request Failed. Status: " + response.status, {cause: response.statusText});
            lastSavedChainDump = JSON.stringify([unusedID, Chain]);
            editID++;
        }
    } else {
        let chainDump = JSON.stringify([unusedID, Chain]);
        let response = await fetch(`${serverAddress}/request/overwrite/${accessKeys.Edit}`, {
            method: "POST", 
            mode: "same-origin",
            cache: "no-cache", 
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({chainDump: chainDump})
        });
        if (response.status != "200") throw Error("Save Failed. Status: " + response.status, {cause: response.statusText});
        editID = (await response.json()).editID;
        lastSavedChainDump = chainDump;
        editRaceDetected = false;
    }
}

async function loadFromCloud(edit, accessKey) {
    try {
        if (edit != "edit" && edit != "view") throw Error("Invalid Path");
        let path = `${serverAddress}/request/${edit}/${accessKey}`;
        const response = await fetch(path);
        if (response.status != "200") throw Error("Load Request Failed. Status: " + response.status, {cause: response.statusText});
        DP.Editable = (edit == "edit");
    
        let [newUnusedID, jsonChain] = await response.json();
        accessKeys = JSON.parse(response.headers.get("AccessKeys"));
        editID = JSON.parse(response.headers.get("EditID"));
        unusedID = newUnusedID;
        Chain.Deserialize(jsonChain);
        if (edit == "view")
            localStorage.setItem("autosave", false);
        lastSavedChainDump = JSON.stringify([unusedID, Chain]);
        beginRender();    
    } catch (error) {
        console.log(error);
        switchToLocal();
        let json = localStorage.getItem("chainDump");
        if (json) {
            unusedID = localStorage.getItem("unusedID");
            loadLocally(json);
        } else {
            newChain();
        }
        }
}


function beginRender() {
    let titleDOM = document.getElementById('title');
    
    titleDOM.replaceChildren(T(Chain.Name));
    if(!DP.Editable) {
        titleDOM.setAttribute("contenteditable", "false");
    } else {
        titleDOM.addEventListener("input", () =>{
            let toDelete = []
            for (let node of titleDOM.childNodes){
                if (node.nodeType == Node.ELEMENT_NODE) toDelete.push(node);
            }
            for (let node of toDelete) {
                node.replaceWith(T(node.textContent));
            }
            Chain.Name = titleDOM.textContent;
        });    
    }

    setupSettingsDropdown(document.getElementById("settings_dropdown").querySelector(".dropdown_body"));
    setupSaveDropdown(document.getElementById("save_dropdown").querySelector(".dropdown_body"));

    populateItineraryMainPanel(true);

}

function newChain() {
    unusedID = 0;

    switchToLocal();

    Object.assign(Chain, new ChainClass());
    let jumper = new Jumper();
    jumper.Primary = true;
    let jump = new Jump();
    Chain.RegisterJump(jump);
    Chain.RegisterCharacter(jumper);

    let bodyMod = new ChainSupplement();
    bodyMod.URL = "https://drive.google.com/file/d/1V9bPZTOgQ4VS9YJiEwEkabaX4GHzyiRf/view";
    bodyMod.Name = "Body Mod";
    bodyMod.MaxInvestment = 100;
    bodyMod.InitialStipend = 100;
    bodyMod.Currency = "EP";
    bodyMod.PurchaseCategories = [
            {Name: "Basic"}, 
            {Name: "Physical"}, 
            {Name: "Mental"},
            {Name: "Spiritual"},
            {Name: "Skill"} ,
            {Name: "Supernatural"},
            {Name: "Item"},
            {Name: "Companion"},
            {Name: "Drawbacks"},
    ];
    Chain.RegisterSupplement(bodyMod);
    
    let personalReality = new ChainSupplement();
    personalReality.URL = "https://docs.google.com/document/d/1yewhouqLvhI9LyFuK6ihZ1JAVX8AvGYb7CDJ1CVihtY/edit#heading=h.lligisf74lzz";
    personalReality.Name = "Personal Reality";
    personalReality.MaxInvestment = 0;
    personalReality.InitialStipend = 500;
    personalReality.PerJumpStipend = 50;
    personalReality.Currency = "WP";
    personalReality.PurchaseCategories = [
            {Name: "Basics"}, 
            {Name: "Utilities & Structures"}, 
            {Name: "Cosmetic Upgrades"},
            {Name: "Facilities"},
            {Name: "Extensions"} ,
            {Name: "Items & Equipment"},
            {Name: "Companions"},
            {Name: "Misc."},
            {Name: "Limitations"},
    ];
    personalReality.CompanionAccess = CompanionAccess.Unavailable;
    personalReality.ItemLike = true;
    Chain.RegisterSupplement(personalReality);

    beginRender();

}

function setupUserPreferences() {
    if (!localStorage.getItem("colorMode")) localStorage.setItem("colorMode", "dark");
    if (!localStorage.getItem("bodyFont")) localStorage.setItem("bodyFont", "3");
    if (!localStorage.getItem("unitsImperial")) localStorage.setItem("unitsImperial", "true");
    if (!localStorage.getItem("autosave")) localStorage.setItem("autosave", "true");
}

function exportFile(){
    URL.revokeObjectURL(chainDataURL);
    let fileName = (Chain.Name ? Chain.Name : "UntitledChain").replace(/[^-._~\/\?#\[\]@!$&'\(\)\*\+,;=a-zA-Z0-9 ]/g, '_') + ".json";
    let file = new File([`[${unusedID}, ${JSON.stringify(Chain)}]`], 
        fileName, {type: "application/json"});
    chainDataURL = URL.createObjectURL(file);
    var link = E("a", {href: chainDataURL, download: fileName}); // Or maybe get it from the current document
    link.click();
}

function switchToLocal() {
    DP = {Editable: true};
    accessKeys = undefined;
    editRaceDetected = false;
    history.replaceState({}, "", `/`);
}

function importFile(json){
    let [newUnusedID, jsonChain] = JSON.parse(json);

    unusedID = newUnusedID;

    switchToLocal();

    Chain.Deserialize(jsonChain);
    beginRender();
}

function applyUserPreferences() {
    document.getElementById("color_mode").setAttribute("href", `/style/${localStorage.getItem("colorMode")}.css`);
    document.body.style.setProperty("--body_font_size", `${.5 + localStorage.getItem("bodyFont")/10}rem`);
    if (localStorage.getItem("autosave") == "true") {
        autosave = setInterval(
            async () => {
                if (!accessKeys) {
                    saveLocally();
                } else if (accessKeys.Edit){
                    try {await saveToCloud();}
                    catch (err) {processSaveError(err);}
                }
            }, secondsBetweenAutosaves * 1000);
    }

}

function loadLocally(json){

    switchToLocal();

    let jsonChain = JSON.parse(json);

    Chain.Deserialize(jsonChain);

    DP = {Editable: true};
    beginRender();

}

async function startUp() {

    setupUserPreferences();
    applyUserPreferences();

    let edit = location.pathname.split("/")[1];
    let accessKey = location.pathname.split("/")[2];

    if (edit && accessKey) {
        try {
            await loadFromCloud(edit, accessKey);
            return;
        } catch (err) {
            console.log(err);
         }
    }

    let json = localStorage.getItem("chainDump");
    if (json) {
        unusedID = localStorage.getItem("unusedID");
        loadLocally(json);
    } else {
        newChain();
    }

}

function setupSettingsDropdown(panel){
    panel.replaceChildren();
    
    let themeSelect = new CheckBoxSelect("Theme", true, false, false, true);
    themeSelect.AddOption("Light Theme", "light", localStorage.getItem("colorMode") == "light");
    themeSelect.AddOption("Dark Theme", "dark", localStorage.getItem("colorMode") == "dark");

    themeSelect.addInputListener( () => {
        localStorage.setItem("colorMode", themeSelect.value);
        document.getElementById("color_mode").setAttribute("href", `/style/${localStorage.getItem("colorMode")}.css`);
    });

    let fontSelect = E("input", {type: "range", step: "0.5", min: "1", max: "6"});
    fontSelect.value = localStorage.getItem("bodyFont");
    fontSelect.addEventListener("change", () => {
        localStorage.setItem("bodyFont", fontSelect.value);
        document.body.style.setProperty("--body_font_size", `${0.5 + fontSelect.value/10}rem`);
    });

    let unitSelect = new CheckBoxSelect("Units", true, false, false, true);
    unitSelect.AddOption("Imperial", "true", localStorage.getItem("unitsImperial") == "true");
    unitSelect.AddOption("Metric", "false", localStorage.getItem("unitsImperial") == "false");
    unitSelect.addInputListener(() => {
        localStorage.setItem("unitsImperial", unitSelect.value);
    });

    let autosaveSelect = new CheckBoxSelect("Autosave", true);
    autosaveSelect.AddOption("Every 60s", "true", localStorage.getItem("autosave") == "true");
    autosaveSelect.AddOption("Never", "false", localStorage.getItem("autosave") == "false");
    autosaveSelect.addInputListener(() => {
        localStorage.setItem("autosave", autosaveSelect.value);
        clearInterval(autosave);
        if (autosaveSelect.value == "true") {
            autosave = setInterval(
                async () => {
                    if (!accessKeys) {
                        saveLocally();
                    } else if (accessKeys.Edit){
                        try {await saveToCloud();}
                        catch (err) {console.log("Test!"); processSaveError(err);}
                    }
                }, secondsBetweenAutosaves * 1000);
            }
    });

    panel.append(
    E("div", {class: "vcentered stretch sublabel"}, T("Preferences:")),
    E("div", {class: "vcentered label"}, T("Theme:")), themeSelect.DOM, 
    E("div", {class: "vcentered label"}, T("Font Size:")), fontSelect, 
    E("div", {class: "vcentered label"}, T("Units:")), unitSelect.DOM,
    E("div", {class: "vcentered label"}, T("Autosave:")), autosaveSelect.DOM 
    );

}

function processSaveError(err) {
    switch (err.cause) {
        case "Conflict":
            renderErrorToUser("Edit Confict Detected",
                "It appears that someone else is editing the same Chain as you. Autosave is temporarily disabled. Save again to overwrite Chain.");
            editRaceDetected = true;
            localStorage.setItem("autosave", false);
            setupSaveDropdown(document.getElementById("save_dropdown").querySelector(".dropdown_body"));
            setupSettingsDropdown(document.getElementById("settings_dropdown").querySelector(".dropdown_body"));
            break;
        default:
            renderErrorToUser("Save Failed", "Unable to save to cloud for unknown reason.");
    }

}

function setupSaveDropdown(panel){
    panel.replaceChildren();

    let localSaveButton = E("div", {class: "button stretch wide"}, 
        T(`${(!accessKeys) ? "Save" : "Copy"} Locally`));
    let cloudSaveButton = E("div", {class: "button stretch wide"}, 
        T((editRaceDetected)?"Overwrite Cloud Save" : "Save To Cloud"));

    localSaveButton.addEventListener("click", () => {
        if (!accessKeys || confirm("WARNING: Will overwrite any other local save."))
            saveLocally();
    });
    cloudSaveButton.addEventListener("click", async () => {
        document.documentElement.classList.add("wait");
        try { 
            await saveToCloud();
            if (location.href.indexOf(accessKeys.Edit) < 0) {
                history.replaceState({}, "", `/edit/${accessKeys.Edit}`);
            }
            setupSaveDropdown(panel);    
        }
        catch (err) {console.log(err); processSaveError(err);}
        finally {document.documentElement.classList.remove("wait");}
    });

    panel.append(
        localSaveButton, 
    );

    if(!accessKeys || accessKeys.Edit) {
        panel.append(cloudSaveButton);
    }

    if (!accessKeys) return;
    if (accessKeys.View) {
        let copyButton = E("div", {class: "wide button offcolor", 
            title: "Link for sharing without editing privileges"
        }, T("Copy View URL"));
        copyButton.addEventListener("click", () => {
            navigator.clipboard.writeText(`${window.location.origin}/view/${accessKeys.View}`);
        });
        panel.append(E("div", {class: "vcentered", style: {justifyContent: "center"}},
            E("a", {class: "icon button link", 
                target: "_blank", 
                href: `/view/${accessKeys.View}`, 
                title: "Link for sharing without editing privileges"}
            ),
        ),
        E("div", {class: "vcentered"},  
            copyButton, 
        )
        );
    }

    
    if (accessKeys.Edit) {
        let copyButton = E("div", {class: "button wide offcolor", 
            title: "Link for sharing with editing privileges"
        }, T("Copy Edit URL"));
        copyButton.addEventListener("click", () => {
            navigator.clipboard.writeText(`${window.location.origin}/edit/${accessKeys.Edit}`);
        });
        panel.append(E("div", {class: "vcentered", style: {justifyContent: "center"}},
            E("a", {class: "icon button link", 
                target: "_blank", 
                href: `/edit/${accessKeys.Edit}`, 
                title: "Link for sharing with editing privileges"}
            ),
        ),
        E("div", {class: "vcentered"},  
            copyButton, 
        )
        );
    }



}


function setupDropdown(id) {
    let dropdown = document.getElementById(`${id}_dropdown`);

    let closeListener = (e) => {
        if (!dropdown.contains(e.target))
            close();
    };

    let closed = dropdown.classList.contains("hidden");

    let close = () => {
        window.removeEventListener("click", closeListener);
        dropdown.classList.add("hidden");
        closed = true;
    };

    let open = (e) => {
        window.addEventListener("click", closeListener);
        dropdown.classList.remove("hidden");
        closed = false;
    };

    document.getElementById(`${id}_button`).addEventListener("click", () => {
        if (closed) open();
        else close();
    });
}



function setUpMainNav(){

    document.getElementById("new_button").addEventListener("click", () => {
        if(confirm("Start a new chain? You'll lose the current one if not backed up!")) {
            newChain();
        }
    });

    document.getElementById("export_button").addEventListener("click", exportFile);
    let fileImport = document.getElementById("file_import");
    fileImport.addEventListener("change", async () => {
        document.body.style.cursor = "progress !important";
        let jsonText = await fileImport.files[0].text();
        importFile(jsonText);
        document.body.style.cursor = "";
    });

    setupDropdown("settings");
    setupDropdown("save");

    setupSettingsDropdown(document.getElementById("settings_dropdown").querySelector(".dropdown_body"));
    setupSaveDropdown(document.getElementById("save_dropdown").querySelector(".dropdown_body"));

}

startUp();
setUpMainNav();