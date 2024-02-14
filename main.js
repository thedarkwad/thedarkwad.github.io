let chainDataURL;

function saveLocally(){
    console.log("Autosaved!");
    localStorage.setItem("chainDump", JSON.stringify(Chain));
    localStorage.setItem("unusedID", unusedID); 
    lastSave = Date.now();
}

function beginRender(){
    let titleDOM = document.getElementById('title');
    titleDOM.replaceChildren(T(Chain.Name));
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

    populateItineraryMainPanel(true);

}

function newChain() {
    unusedID = 0;
    Object.assign(Chain, new ChainClass());
    DP = {};
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
    localStorage.setItem("colorMode", "dark");
    localStorage.setItem("bodyFont", "3");
    localStorage.setItem("unitsImperial", "true");
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

function importFile(json){
    let [newUnusedID, jsonChain] = JSON.parse(json);
    console.log(jsonChain);

    unusedID = newUnusedID;
    
    Chain.Deserialize(jsonChain);
    beginRender();
}


function applyUserPreferences() {
    document.getElementById("color_mode").setAttribute("href", `style_${localStorage.getItem("colorMode")}.css`);
    document.body.style.setProperty("--body_font_size", `${.5 + localStorage.getItem("bodyFont")/10}rem`);
}


function load(json){
    let jsonChain = JSON.parse(json);
    unusedID = localStorage.getItem("unusedID");

    Chain.Deserialize(jsonChain);

    beginRender();

}

function startUp() {

    if(!localStorage.getItem("colorMode")) setupUserPreferences();
    applyUserPreferences();

    let json = localStorage.getItem("chainDump");
    if (json) {
        load(json);
    } else {
        newChain();
    }

    let secondsBetweenAutosaves = 60;
    setInterval(saveLocally, secondsBetweenAutosaves * 1000);

}

function setupSettingsDropdown(panel){
    let themeSelect = new CheckBoxSelect("Theme", true);
    themeSelect.AddOption("Light Theme", "light", localStorage.getItem("colorMode") == "light");
    themeSelect.AddOption("Dark Theme", "dark", localStorage.getItem("colorMode") == "dark");

    themeSelect.addInputListener( () => {
        localStorage.setItem("colorMode", themeSelect.value);
        document.getElementById("color_mode").setAttribute("href", `style_${localStorage.getItem("colorMode")}.css`);
    });

    let fontSelect = E("input", {type: "range", step: "0.5", min: "1", max: "6"});
    fontSelect.value = localStorage.getItem("bodyFont");
    fontSelect.addEventListener("change", () => {
        localStorage.setItem("bodyFont", fontSelect.value);
        document.body.style.setProperty("--body_font_size", `${0.5 + fontSelect.value/10}rem`);
    });

    let unitSelect = new CheckBoxSelect("Units", true);
    unitSelect.AddOption("Imperial", "true", localStorage.getItem("unitsImperial") == "true");
    unitSelect.AddOption("Metric", "false", localStorage.getItem("unitsImperial") == "false");
    unitSelect.addInputListener(() => {
        localStorage.setItem("unitsImperial", unitSelect.value);
    });


    panel.append(
    E("div", {class: "vcentered stretch sublabel"}, T("Preferences:")),
    E("div", {class: "vcentered label"}, T("Theme:")), themeSelect.DOM, 
    E("div", {class: "vcentered label"}, T("Font Size:")), fontSelect, 
    E("div", {class: "vcentered label"}, T("Units:")), unitSelect.DOM );

}

function setUpMainNav(){

    document.getElementById("new_button").addEventListener("click", () => {
        if(confirm("Start a new chain? You'll lose the current one if not backed up!")) {
            newChain();
        }
    });

    document.getElementById("save_button").addEventListener("click", saveLocally);
    document.getElementById("export_button").addEventListener("click", exportFile);
    let fileImport = document.getElementById("file_import");
    fileImport.addEventListener("change", async () => {
        document.body.style.cursor = "progress !important";
        let jsonText = await fileImport.files[0].text();
        importFile(jsonText);
        document.body.style.cursor = "";
    });

    let dropdown = document.getElementById("settings_dropdown");
    let dropdownBody = dropdown.querySelector(".dropdown_body");

    let closeListener = (e) => {
        if(!dropdown.contains(e.target)) 
            close();
    }

    let closed = dropdown.classList.contains("hidden");

    let close = () => {
        window.removeEventListener("click", closeListener);
        dropdown.classList.add("hidden");
        closed = true;
    }

    let open = (e) => {
        window.addEventListener("click", closeListener);
        dropdown.classList.remove("hidden");
        closed = false;
    }

    document.getElementById("settings_button").addEventListener("click", () => {
        if (closed) open();
        else close();
    });

    setupSettingsDropdown(document.getElementById("settings_dropdown").querySelector(".dropdown_body"));

}

setUpMainNav();
startUp();
