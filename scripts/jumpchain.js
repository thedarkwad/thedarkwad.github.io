const CostModifiers = {
    "Full": 0,
    "Reduced": 1,
    "Free": 2
};

const PurchaseTypes = {
    "Perk": 0,
    "Item": 1,
    "Companion": 2,
    "Supplement": 3, 
    "Subsystem": 4
};

const DrawbackTypes = {
    "Drawback": 0, 
    "Scenario": 1
};

const ChainSettings = {
    NoCompanions: 0,
    YesCompanions: 1,
    ExponentialCompanions: 2,
    NoAltForms : 3,
    YesAltForms: 4,
    NoNarratives: 5,
    YesNarratives : 6,
    PrimaryNarrativesOnly: 7
}

let unusedID = 0;

let ExportFormats = {
    HTML: 0,
    BBCode: 1,
    Reddit: 2
};

function escapeText(text, exportFormat)
{
    switch (exportFormat) {
        case ExportFormats.HTML:
            return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");   
        case ExportFormats.BBCode:
            return `[plain]${text}[/plain]`;
        default:
            return text;
    }
 }

function exTag(tag, text, exportFormat) {
    switch (tag) {
        case "h1":
            switch (exportFormat) {
                case ExportFormats.HTML:
                    return `<h1>${text}</h1>\n`; 
                case ExportFormats.BBCode:
                    return `[h1]${text}[/h1]\n`;
                case ExportFormats.Reddit:
                    return `# ${text}\n`;  
            }
        break;
        case "h2":
            switch (exportFormat) {
                case ExportFormats.HTML:
                    return `<h2>${text}</h2>\n`; 
                case ExportFormats.BBCode:
                    return `[h2]${text}[/h2]\n`;
                case ExportFormats.Reddit:
                    return `## ${text}\n`;  
            }
        break;
        case "b":
            switch (exportFormat) {
                case ExportFormats.HTML:
                    return `<b>${text}</b>`; 
                case ExportFormats.BBCode:
                    return `[b]${text}[/b]`;
                case ExportFormats.Reddit:
                    return `__${text}__`;  
            }
        break;
        case "i":
            switch (exportFormat) {
                case ExportFormats.HTML:
                    return `<i>${text}</i>`; 
                case ExportFormats.BBCode:
                    return `[i]${text}[/i]`;
                case ExportFormats.Reddit:
                    return `_${text}_`;  
            }
        break;


    }
}

function exParagraph(title, text, exportFormat){

    switch(exportFormat) {
        case ExportFormats.HTML:
            return "<p>\n" + `<h3>${title}</h3>\n` + text + "</p>\n";
        case ExportFormats.BBCode:
            return `[SPOILER=${title}]\n${text}[/SPOILER]`;
        case ExportFormats.Reddit:
            return `### ${title}\n${text}`;    

    }
    
}

function exList(items, exportFormat){
    let ret = "";
    
    if (items.length == 0) return ret;

    switch(exportFormat) {
        case ExportFormats.HTML:
            ret += "<ul>\n";
            for (let i of items) {
                ret += `<li>${i}</li>\n`
            }
            ret += "</ul>";
            break;
        case ExportFormats.BBCode:
            ret += "[LIST]\n";
            for (let i of items) {
                ret += `[*]${i}\n`
            }
            ret += "[/LIST]";
            break;
        case ExportFormats.Reddit:
            for (let i of items) {
                ret += `- ${i}\n`
            }
        break;
    }
    return ret;

}


function exLink(text, url, exportFormat){
    switch(exportFormat) {
        case ExportFormats.HTML:
            return `<a href="${url}">${text}</a>`;
        case ExportFormats.BBCode:
            return `[URL=${url}]${text}[/URL]`;
        case ExportFormats.Reddit:
            return `[${text}]${url}`;    
    }

}


class Jumper {
    constructor(){
        this.Name = "Jumper";
        this.Gender = "Mysterious";
        this.OriginalAge = 15 + Math.floor(Math.random() * 20);
        this.OriginalForm = new AltForm(this.ID);
        this.OriginalForm.Name = "Original Body"
        this.Primary = false;
        this.Personality = "";
        this.Motivation = "";
        this.Likes = "";
        this.Dislikes = "";
        this.Quirks = "";
        this.OriginalBackground = {Summary: "Typical Universe Denizen", Description: ""};
        this.PerkCount = 0;
        this.ItemCount = 0;
    }

    Export(format, includePerks = false) {
        let ex = "";
        ex += exTag("h2", escapeText(this.Name, format), format) ; 
        ex += exTag("b", "Original Age:", format) + " " + escapeText(this.OriginalAge, format) + "\n";
        ex += exTag("b", "Gender:", format) + " " + escapeText(this.Gender, format) + "\n";
        ex += exTag("b", "Background:", format) + " " + escapeText(this.OriginalBackground.Summary, format) + "\n";
        if (this.OriginalBackground.Description) ex += escapeText(this.OriginalBackground.Description) + "\n";
        
        let personalityExports = [];
        
        if (this.Personality.length > 0) {
            personalityExports.push(exTag("b", "Personality:", format) + " " + escapeText(this.Personality, format));
        }

        if (this.Motivation.length > 0) {
            personalityExports.push(exTag("b", "Motivation:", format) + " " + escapeText(this.Motivation, format));
        }

        if (this.Likes.length > 0) {
            personalityExports.push(exTag("b", "Likes:", format) + " " + escapeText(this.Likes, format));
        }

        if (this.Dislikes.length > 0) {
            personalityExports.push(exTag("b", "Dislikes:", format) + " " + escapeText(this.Dislikes, format));
        }

        if (this.Quirks.length > 0) {
            personalityExports.push(exTag("b", "Quirks:", format) + " " + escapeText(this.Quirks, format));
        }

        if (personalityExports.length > 0){
            ex += exParagraph("Personality:",
            exList(personalityExports, format),
            format);      
        }

        // ex += exParagraph("Body:",
        //     this.OriginalForm.Export(format),
        // format);      

        return ex;
    }

    Deserialize(json) {
        Object.assign(this, json);
        this.OriginalForm = new AltForm(this.ID).Deserialize(this.OriginalForm);
        return this;
    }

    get FieldList(){
        let fieldList = {};
        fieldList.Name = {InputType: "text", DataType: "String"};
        fieldList.Gender = {InputType: "text", DataType: "String"};
        fieldList.OriginalAge = {InputType: "number", DataType: "Integer", Step: 1};
        fieldList.Primary = {InputType: "select", Options: [
            {Text: "Primary Jumper", Value: true}, 
            {Text: "Companion", Value: false},
        ]};
        fieldList.OriginalBackground_Summary = 
            {InputType: "text", DataType: "String", Placeholder: "Short Sum-Up"};
        fieldList.OriginalBackground_Description = 
            {InputType: "textarea", DataType: "String", Placeholder: "Detailed Description"};
        fieldList.Personality = {InputType: "textarea", DataType: "String"};
        fieldList.Motivation = {InputType: "textarea", DataType: "String"};
        fieldList.Likes = {InputType: "textarea", DataType: "String"};
        fieldList.Dislikes = {InputType: "textarea", DataType: "String"};
        fieldList.Quirks = {InputType: "textarea", DataType: "String"};
        return fieldList;
    }

    Unregister(){
        delete Chain.Characters[this.ID];
        for (let j of Chain.Jumps) {
            j.UnregisterCharacter(this.ID);
            for (let i = 0; i < j.Purchases.length; i++){
                if (j.Purchases[i].JumperID == this.ID) {
                    j.Purchases[i].Unregister();
                    i--;
                }
            }
        }
    }

    get TrueAge(){
        let trueAgeYears = +this.OriginalAge;
        let trueAgeMonths = 0, trueAgeDays = 0;
        for (let j of Chain.Jumps) {
            if (j.JumpedBy(this.ID)) {
                trueAgeYears += j.Length.Years;
                trueAgeMonths += j.Length.Months;
                trueAgeDays += j.Length.Days;
            }
        }
        trueAgeMonths += Math.floor(trueAgeDays / 30);
        trueAgeYears += Math.floor(trueAgeMonths / 12);
        return trueAgeYears;
    }

    get JumpsMade() {
        let jumps = 0;
        for (let j of Chain.Jumps) {
            if (j.JumpedBy(this.ID)) {
                jumps++;
            }
        }
        return jumps;
    }
}

function truncate(n) {
    return n.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];
}

class ChainClass {
    constructor(){
        this.VersionNumber = "1.0";
        this.Name = "";
        this.Jumps = [];
        this.Characters = {};
        this.Drawbacks =[];
        this.HouseRules = [];
        this.PurchaseCategories = {};
        this.Supplements = [];
        this.Notes = [];
        this.PurchaseCategories[PurchaseTypes.Perk] = [
            {Name: "Physical"}, 
            {Name: "Mental"}, 
            {Name: "Social"},
            {Name: "Magical"} ,
            {Name: "Spiritual"},
            {Name: "Crafting"},
            {Name: "Skill"},
            {Name: "Other"}];
        this.PurchaseCategories[PurchaseTypes.Item] = [
            {Name: "Weapons"}, 
            {Name: "Apparel"}, 
            {Name: "Equipment"},
            {Name: "Materials"},
            {Name: "Food & Drug"},            
            {Name: "Media"},
            {Name: "Wealth"},
            {Name: "Vehicles"},
            {Name: "Tools"},
            {Name: "Places"},
            {Name: "Creatures"},
            {Name: "Businesses & Contacts"},
            {Name: "Other"}
        ];
        this.PurchaseCategories[PurchaseTypes.Companion] = [{Name: "Companion"}];
        this.PurchaseCategories[PurchaseTypes.Subsystem] = [{Name: ""}];

        this.CompanionSetting = ChainSettings.YesCompanions;
        this.AltFormSetting = ChainSettings.YesAltForms;
        this.NarrativeSetting = ChainSettings.YesNarratives;

        this.Bank = {
            Enabled: false,
            MaxDeposit: 200,
            DepositRatio: 50,
            InterestRate: 0
        }

    }

    RecalculateJumperStats(){
        for (let cID in this.Characters) {
            this.Characters[cID].PerkCount = 0;
            this.Characters[cID].ItemCount = 0;
        }
        for (let j of this.Jumps) {
            for (let p of j.Purchases) {
                
                if (p.Type == PurchaseTypes.Perk) {
                    this.Characters[p.JumperID].PerkCount++;
                }

                if (p.Type == PurchaseTypes.Item) {
                    this.Characters[p.JumperID].ItemCount++;
                }
            }
        }
    }

    RegisterChainDrawback(d) {
        d.ID = unusedID;
        this.Drawbacks.push(d);
        return unusedID++;
    }

    CalculateBankBalance(jump, jumperID) {
        let bankedBCP = 0;
        for (let j of this.Jumps) {
            if (j.ParentJumpID < 0) bankedBCP *= 1 + this.Bank.InterestRate / 100;
            if (jump.ID == j.ID) return Math.floor(bankedBCP);
            let deposit = j.BankDeposits[jumperID];
            bankedBCP += ((deposit > 0) ? (this.Bank.DepositRatio / 100) : 1) * deposit;
        }
    } 

    get BankFieldList() {
        return {
            "Enabled": {InputType: "checkbox", DataType: "Boolean"}, 
            "MaxDeposit": {InputType: "number", DataType: "Integer", Placeholder: "Max Deposit", Step: "50"},
            "DepositRatio": {InputType: "number", DataType: "Integer", Placeholder: "Deposit Ratio", Step: "10"}, 
            "InterestRate": {InputType: "number", DataType: "Integer", Placeholder: "Interest Rate", Step: "10"}, 
 
        }
    }

    Deserialize(json) {
        Object.assign(this, json);
        this.Jumps = this.Jumps.filter((i) => (i != null) && (i != undefined)).map((j) => {return new Jump().Deserialize(j);});
        for (let cID in this.Characters) {
            this.Characters[cID] = new Jumper().Deserialize(this.Characters[cID]);
        }
        this.Drawbacks = this.Drawbacks.filter((i) => (i != null) && (i != undefined)).map((d) => {return new ChainDrawback(d.JumperID).Deserialize(d);});
        this.HouseRules = this.HouseRules.filter((i) => (i != null) && (i != undefined)).map((n) => {return new Note(n.Title, n.Text);});
        this.Supplements = this.Supplements.filter((i) => (i != null) && (i != undefined)).map((s) => {return new ChainSupplement().Deserialize(s);});

        this.RecalculateJumperStats();

        return this;
    }


    RegisterSupplement(supp){
        supp.ID = unusedID;
        this.Supplements.push(supp);

        for (let char in this.Characters){
            for (let jump of this.Jumps) {
                jump.SupplementInvestments[char][supp.ID] = 0;
                jump.SupplementStipends[char][supp.ID] = 0;
            }    
        }

        return unusedID++;

    }

    RegisterJump(jump) {
        jump.ID = unusedID;
        this.Jumps.push(jump);
        for (let s of this.Supplements) {
            for (let char in this.Characters){
                jump.SupplementInvestments[char][s.ID] = 0;
                jump.SupplementStipends[char][s.ID] = 0;    
            }
        }
        return unusedID++;
    }

    Jump(jumpID){
        for (let i in this.Jumps){
            if(this.Jumps[i].ID == jumpID) return this.Jumps[i];
        }
    }

    ReorderJumps(o, f){
        let i = 1;
        while (o > 0 && this.Jumps[o].ParentJumpID >= 0) {o--;}
        while (o + i < this.Jumps.length && (this.Jumps[o + i].ParentJumpID == this.Jumps[o].ID)) {i+=1;}

        f = (f > o) ? (f - i) : f;

        if (f < 0) return;

        this.Jumps.splice(f, 0, ...this.Jumps.splice(o, i));

    }

    RegisterCharacter(char){
        char.ID = unusedID;
        this.Characters[char.ID] = char;
        for (let jump of this.Jumps){
            jump.RegisterCharacter(char.ID);
        }
        return unusedID++;
    }

    TallyDrawbacks(jump){
        let drawbackTally = {General: 0, Items: 0, Companions: 0};
        for (let i in this.Drawbacks) {
            let drawback = this.Drawbacks[i];
            if (jump.ExcludedDrawbacks.includes(+drawback.ID)) continue;
            if (drawback.AutoRevoke > 0 && jump.JumpNumber > drawback.AutoRevoke) continue;
            drawbackTally.General += drawback.Cost;
            drawbackTally.Companions += drawback.CompanionStipend;
            drawbackTally.Items += drawback.ItemStipend;
        }
        return drawbackTally;
    }

    TallySupplementPoints(supp, jump, jumperID) {
        let total = supp.InitialStipend + (jump.JumpNumber - 1) * supp.PerJumpStipend;
        for (let j of this.Jumps) {
            if (jump.ID == j.ID) break;
            if (supp.CompanionAccess == CompanionAccess.Communal) {
                for (let jID in this.Characters){
                    total += j.SupplementStipends[jID][supp.ID];
                    total += Math.round(supp.InvestmentRatio * j.SupplementInvestments[jID][supp.ID] / 100);
                }
            } else {
                total += j.SupplementStipends[jumperID][supp.ID]; 
                total += Math.round(supp.InvestmentRatio * j.SupplementInvestments[jumperID][supp.ID] / 100);      
            }
            for (let p of j.Purchases){
                if (p.Type != PurchaseTypes.Supplement) continue;
                if(supp.CompanionAccess != CompanionAccess.Communal && p.JumperID != jumperID) continue;
                if (p.Supplement.ID != supp.ID) continue;
                total -= p.Cost;
            }
        }
        return total;
    }

    GetSupplementPurchases(supp, jump) {
        let purchases = [];
        for (let j of this.Jumps){
            if (jump.ID == j.ID) break;
            purchases = purchases.concat(j.Purchases.filter(
                (p) => (
                    p.Type == PurchaseTypes.Supplement 
                    && p.Supplement.ID == supp.ID
                    && ( p.Duration < 0 || p.Duration > (jump.JumpNumber - j.JumpNumber)))
            ) );
        }
        return purchases;
    }
}

const Chain = new ChainClass();


class Purchase {
    constructor(jumperID, purchaseType){
        this.JumperID = jumperID;
        this.Name = "";
        this.Currency = 0;
        this.Description = "";
        this.InternalType = purchaseType;
        this.Subtype = ""; // eg. Perks in almost any Jump, Boons in Hades
        this.Value = 0;
        this.CostModifier = CostModifiers.Full;
        this.Category = ["Uncategorized"]; // "Physical", "Magical" etc. for Perks, "Weapons", "Armor" etc. for Items
        this.Tags = [];
        this.Temporary = false;
        this.JumpID = -1;

        if (purchaseType == PurchaseTypes.Perk) {
            Chain.Characters[jumperID].PerkCount++;
        }

        if (purchaseType == PurchaseTypes.Item) {
            Chain.Characters[jumperID].ItemCount++;
        }

        if (purchaseType == PurchaseTypes.Companion) {
            this.Allowances = {};
            this.Stipends = {};
            this.CompanionIDs = [];    
        }

        if (purchaseType == PurchaseTypes.Supplement) {
            this.Duration = -1;
        }

    }

    Export() {
        let ex = "";
        ex += `${exTag("b", escapeText(this.Name), format)}[${ex}]`;
        return ex;
    }

    Deserialize(json) {
        Object.assign(this, json);
        return this;
    }

    get Jump(){
        return Chain.Jump(this.JumpID);
    }

    set Type(type) {
        switch (this.InternalType) {
            case PurchaseTypes.Perk:
                Chain.Characters[this.JumperID].PerkCount--; break;
            case PurchaseTypes.Item:
                Chain.Characters[this.JumperID].ItemCount--; break;
        }
        switch (type) {
            case PurchaseTypes.Perk:
                Chain.Characters[this.JumperID].PerkCount++; break;
            case PurchaseTypes.Item:
                Chain.Characters[this.JumperID].ItemCount++; break;
        }
        this.InternalType = type;
    }

    get Type() {
        return this.InternalType;
    }

    get Cost() {
        switch(this.CostModifier){
            case CostModifiers.Free: return 0;
            case CostModifiers.Reduced: return Math.floor(this.Value / 2);
            case CostModifiers.Full: return this.Value;
            default: console.error(`Invalid Cost Modifier for Purchase ${this.Name}`);
        }
    }

    Includes(searchTerm){
        if (searchTerm.length == 0) return true;
        let regex = new RegExp(searchTerm.trim(), "i");
        if (this.Name.search(regex) >= 0) return true;
        if (this.Description.search(regex) >= 0) return true;

        for (let tag of this.Tags) {
            if (tag.search(regex) >= 0) {
                return true;
            }
        }

        return false;
    }

    Unregister() {
        let jump = Chain.Jump(this.JumpID);
        jump.Purchases.splice(jump.Purchases.indexOf(this), 1);
        for (let i in jump.SubsystemAccess[this.JumperID]){
            if (jump.SubsystemAccess[this.JumperID][i].PurchaseID == this.ID) {
                delete jump.SubsystemAccess[this.JumperID][i];
            }
        }

        if (this.Type == PurchaseTypes.Perk) {
            Chain.Characters[this.JumperID].PerkCount--;
        }

        if (this.Type == PurchaseTypes.Item) {
            Chain.Characters[this.JumperID].ItemCount--;
        }
    
        jump.UpdateBudgets(this.JumperID);
    }

    get FieldList() {
        let fieldList = {};
        fieldList.Name = {InputType: "text", DataType: "String", Focus: "True"};
        fieldList.Description = {InputType: "textarea", DataType: "String"};
        fieldList.Value = {InputType: "number", DataType: "Integer", Step: "50"};
        fieldList.Temporary = {InputType: "checkbox", DataType:"Boolean"};
        fieldList.Tags = {InputType: "textarea", DataType: "[String]"}
        fieldList.CostModifier = {InputType: "select", Options: 
                [
                    {Text: "Full Price", Value:CostModifiers.Full}, 
                    {Text: "Reduced Price", Value:CostModifiers.Reduced},
                    {Text: "Free", Value:CostModifiers.Free}
                ]};
                
        fieldList.Subtype = {InputType: "select", Options: []}; 
        fieldList.Category = {InputType: "multiselect", Abbreviate: true, Options: []};
        fieldList.Duration = {InputType: "optional_numeric", 
            InactiveLabel: "Never Revoke", ActiveLabel: "Revoke After", 
            Step: "1"};
    
        let jump = Chain.Jump(this.JumpID);
        for (let subtype in jump.PurchaseSubTypes) {
            if (!jump.PurchaseSubTypes[subtype].Subsystem && jump.PurchaseSubTypes[subtype].Type == this.Type) 
                fieldList.Subtype.Options.push({Text: jump.PurchaseSubTypes[subtype].Name, Value: subtype});
        }
    
        if (this.Type != PurchaseTypes.Supplement){
            fieldList.Category.Options = Chain.PurchaseCategories[this.Type].map(
                (c) => {return {Text: c.Name, Value: c.Name};}
            );    
        } else {
            fieldList.Category.Options = this.Supplement.PurchaseCategories.map(
                (c) => {return {Text: c.Name, Value: c.Name};}
            );
        }

        fieldList.CompanionIDs = {InputType: "multiselect", 
            Options: [], 
            Placeholder: "Companions",
            Abbreviate: false, 
            Important: "true",
            DefaultSingle: false
        };

        for (let ID in Chain.Characters) {
            if(!Chain.Characters[ID].Primary && ID != this.JumperID)
                fieldList.CompanionIDs.Options.push({Text: Chain.Characters[ID].Name, Value: +ID});
        }

        fieldList.Currency = {InputType: "select", Placeholder: "Currency", Options: []}; 
        fieldList.Allowances = {InputType: "multiselect_numeric", Placeholder: "Allowance", Options: []};

        for (let c in jump.Currencies) {
            fieldList.Currency.Options.push(
                {Text: jump.Currencies[c].Abbrev, Value: c}
            );
            fieldList.Allowances.Options.push({Text: jump.Currencies[c].Abbrev, Field: c});
            fieldList[`Stipends_${c}`] = {InputType: "multiselect_numeric", 
                Placeholder: `${jump.Currencies[c].Abbrev} Stipends`, Options: []};

            for (let subtype in jump.PurchaseSubTypes) {
                if (jump.PurchaseSubTypes[subtype].Type != PurchaseTypes.Companion &&
                    jump.PurchaseSubTypes[subtype].Type != PurchaseTypes.Supplement)
                fieldList[`Stipends_${c}`].Options.push(
                    {Text: `${jump.PurchaseSubTypes[subtype].Name} Stipend`, 
                    Field: subtype});
            }    
        }

        return fieldList;
    }

}

class Drawback {
    constructor(jumperID, drawbackType){
        this.JumperID = jumperID;
        this.CostModifier = CostModifiers.Full;
        this.Name = "";
        this.Description = "";
        this.Type = drawbackType;
        this.Stipend = "";
        this.Value = 0;
        this.Currency = 0;
        this.JumpID = -1;
        this.Reward = "";
    }

    Deserialize(json) {
        Object.assign(this, json);
        return this;
    }


    get Jump(){
        return Chain.Jump(this.JumpID);
    }

    get Cost() {
        switch(this.CostModifier){
            case CostModifiers.Free: return 0;
            case CostModifiers.Reduced: return Math.floor(this.Value / 2);
            case CostModifiers.Full: return this.Value;
            default: console.error(`Invalid Cost Modifier for Purchase ${this.Name}`);
        }
    }

    Unregister() {
        Chain.Jump(this.JumpID).Drawbacks.splice(Chain.Jump(this.JumpID).Drawbacks.indexOf(this), 1);
    }

    get FieldList() {
        let fieldList = {};
        fieldList.Name = {InputType: "text", DataType: "String", Placeholder: "Name", Focus: "True"};
        fieldList.Description = {InputType: "textarea", DataType: "String", Placeholder: "Description"};
        fieldList.Value = {InputType: "number", DataType: "Integer", Placeholder: "Value", Step: 50};
        fieldList.Reward = {InputType: "textarea", DataType: "String", Placeholder: "Reward(s)"};
        fieldList.CostModifier = {InputType: "select", Placeholder: "Cost Modifier", Options: 
                [
                    {Text: "Full", Value:CostModifiers.Full}, 
                    {Text: "Reduced", Value:CostModifiers.Reduced},
                    {Text: "Zero", Value:CostModifiers.Free}
                ]};
        fieldList.Currency = {InputType: "select", Placeholder: "Currency", Options: []}; 
    
        let jump = Chain.Jump(this.JumpID);
        for(let i in jump.Currencies){
            fieldList.Currency.Options.push(
                {Text: jump.Currencies[i].Abbrev, Value: jump.Currencies[i].ID}
            );
        }
        return fieldList;
    
    }

}


class ChainDrawback extends Drawback {
    
    constructor(jumperID) {
        super(jumperID, DrawbackTypes.Drawback);
        this.AutoRevoke = -1;
        this.ItemStipend = 0;
        this.CompanionStipend = 0;
    }

    Deserialize(json) {
        Object.assign(this, json);
        return this;
    }

    Unregister() {
        Chain.Drawbacks.splice(Chain.Drawbacks.indexOf(this), 1);
    }


    get FieldList() {
        let fieldList = {};
        fieldList.Name = {InputType: "text", DataType: "String", Placeholder: "Name", Focus: "True"};
        fieldList.Description = {InputType: "textarea", DataType: "String", Placeholder: "Description"};
        fieldList.Value = {InputType: "number", DataType: "Integer", Placeholder: "Value", Step: 50};
        fieldList.ItemStipend = {InputType: "number", DataType: "Integer", Placeholder: "Item Stipend", Step: 50};
        fieldList.CompanionStipend = {InputType: "number", DataType: "Integer", Placeholder: "Companion Stipend", Step: 50};
        fieldList.CostModifier = {InputType: "select", Placeholder: "Cost Modifier", Options: 
                [
                    {Text: "Full", Value:CostModifiers.Full}, 
                    {Text: "Reduced", Value:CostModifiers.Reduced},
                    {Text: "Zero", Value:CostModifiers.Free}
                ]};
        fieldList.AutoRevoke = {InputType: "optional_numeric", 
            InactiveLabel: "Never Revoke", ActiveLabel: "Revoke After", 
            Step: "1"};

        return fieldList;
    
    }


}

class Jump {
    constructor(){
        this.Name = "";
        this.OriginCategories = {};

        this.URL = "";
        this.Currencies = {
            0: {ID: 0, Name:"Choice Points", Abbrev: "CP", Budget: 1000, Essential: true}
        };

        this.PurchaseSubTypes = [
            {Name: "Perk", Stipend: 0, Currency: "0", Type: PurchaseTypes.Perk, 
                Essential: true, Locked: ["Name", "Type", "Subsystem"]},
            {Name: "Item", Stipend: 0, Currency: "0", Type: PurchaseTypes.Item, 
                Essential: true, Locked: ["Name", "Type", "Subsystem"]}, 
            {Name: "Import", Stipend: 0, Currency: "0", Type:PurchaseTypes.Companion, 
                Essential: true, Locked: ["Name", "Type", "Subsystem"]},
            {Name: "Power", Stipend: 0, Currency: "0", Type: PurchaseTypes.Perk},
            {Name: "Purchase", Stipend: 0, Currency: "0", Type:PurchaseTypes.Supplement
                , Hidden: true},
        ];

        this.BankDeposits = {};
        this.SubsystemAccess = {};
        // {PurchaseID: ; Value: ; Currency: }

        this.Length = {Years: 10, Months: 0, Days: 0};
        this.Purchases = [];
        this.PhysicalForms = [];
        this.Drawbacks = [];
        this.Supplement = false;
        this.ParentJumpID = -1;

        this.ExcludedDrawbacks = [];

        this.SupplementInvestments = {};
        this.SupplementStipends = {};
        
        this.NameRender = null;
        this.RenderLocation = {};
        this.StipendRenders = {};

        this.Origins = {};
        this.Budgets = {};
        this.Narratives = {};
        for (let jumperID in Chain.Characters){
            this.RegisterCharacter(jumperID);
        }

    this.AddOriginCategory({Name: "Age", Single: true, Def: "25"});
    this.AddOriginCategory({Name: "Gender", Single: true, Def: "Mysterious"});
    this.AddOriginCategory({Name: "Location", Single: false, Def: "Parts Unknown"});
    this.AddOriginCategory({Name: "Species", Single: false, Def: "Human"});
    this.AddOriginCategory({Name: "Origin", Single: false, Def: "Drop-In"});
    }

    Deserialize(json) {
        Object.assign(this, json);
        this.Purchases = this.Purchases.filter((i) => (i != null) && (i != undefined)).map((p) => {return new Purchase(p.JumperID, p.Type).Deserialize(p);});
        this.PhysicalForms = this.PhysicalForms.filter((i) => (i != null) && (i != undefined)).map((f) => {return new AltForm(f.JumperID).Deserialize(f);});
        this.Drawbacks = this.Drawbacks.filter((i) => (i != null) && (i != undefined)).map((d) => {return new Drawback(d.JumperID, d.Type).Deserialize(d);});

        for (let charID in this.SubsystemAccess) {
            for (let i in this.SubsystemAccess[charID]) {
                if (this.SubsystemAccess[charID][i].Purchase) {
                    this.SubsystemAccess[charID][i].PurchaseID = this.SubsystemAccess[charID][i].Purchase.ID;
                    delete this.SubsystemAccess[charID][i].Purchase;
                }
            }
        } 

        for (let p of this.Purchases) {
            if (p.Currency in this.Currencies == false) p.Currency = 0;
        } 
        
        for (let p of this.Drawbacks) {
            if (p.Currency in this.Currencies == false) p.Currency = 0;
        } 


        return this;
    }

    AvailableDeposit(jumperID){
        let deposit = 0;
        for (let j of Chain.Jumps) {
            if (j.ID == this.ParentJumpID 
                || (this.ParentJumpID >= 0 && j.ParentJumpID == this.ParentJumpID) 
                || j.ParentJumpID == this.ID){
                if (j.ID == this.ID) continue;
                deposit += Math.max(0, j.BankDeposits[jumperID]);
            }
        }
        return Chain.Bank.MaxDeposit - deposit;
    }


    Unregister() {
        for (let i in Chain.Jumps){
            if (Chain.Jumps[i].ID == this.ID) {
                Chain.Jumps.splice(i, 1);
            }
        }
    }

    AddCurrency(c) {
        c.ID = unusedID;
        this.Currencies[c.ID] = c;
        for (let jID in Chain.Characters) this.StipendRenders[jID][c.ID] = {};
        for (let p of this.Purchases) {
            if (p.Stipends) {
                p.Stipends[c.ID] = {};
            }
        } 
        return unusedID++;
    }

    RemoveCurrency(c) {
        if (c.Essential) return;
        delete this.Currencies[c.ID];
        for (let jID in Chain.Characters) delete this.StipendRenders[jID][c.ID];
        for (let p of this.Purchases) {
            if (p.Currency == c.ID) p.Currency = 0;
            if (p.Allowances && c.ID in p.Allowances) delete p.Allowances[c.ID];
            if (p.Stipends && c.ID in p.Stipends) delete p.Stipends[c.ID];
        } 

        for (let p of this.Drawbacks) {
            if (p.Currency == c.ID) p.Currency = 0;
        } 

    }


    JumpedBy(jumperID){
        let jumper = Chain.Characters[jumperID];
        if (!jumper) return false;
        if (jumper.Primary) return true;
        for (let p of this.Purchases) {
            if (p.Type == PurchaseTypes.Companion 
                && (p.CompanionIDs.includes(+jumperID) || p.CompanionIDs.includes(`${jumperID}`)))
                return true; 
        }
        return false;
    }

    get JumpNumber() {
        let i = 0;
        for (let j of Chain.Jumps) {
            if (j.ParentJumpID < 0) i++;
            if (j.ID == this.ID) return i;
        }
    }

    NewPurchase(jumperID, type, supp = undefined){
        let purchase = new Purchase(jumperID, type);
        if (type == PurchaseTypes.Supplement) purchase.Supplement = supp;
        let purchaseCategories = 
            (type != PurchaseTypes.Supplement) ? Chain.PurchaseCategories[type] : supp.PurchaseCategories;
        if (purchaseCategories.length == 1) purchase.Category = [purchaseCategories[0].Name];
        if(type == PurchaseTypes.Companion){
            for (let c in this.Currencies){
                purchase.Stipends[c] = {};
            }
        }

        for (let subtype in this.PurchaseSubTypes){
            if (purchase.Type == this.PurchaseSubTypes[subtype].Type) {
                purchase.Subtype = subtype; break;
            }
        }
        this.RegisterPurchase(purchase);
        return purchase;


    }

    NewAltForm(jumperID) {
        let altForm = new AltForm(jumperID);
        this.RegisterAltForm(altForm);
        return altForm;
    }

    NewDrawback(jumperID, type) {
        let drawback = new Drawback(jumperID, type);
        this.RegisterDrawback(drawback);
        return drawback;
    }

    AddOriginCategory(originCat){
        originCat.ID = unusedID;
        this.OriginCategories[originCat.ID] = originCat;
        for(let jumperID in Chain.Characters){
            this.Origins[jumperID][originCat.ID] = {};
            this.Origins[jumperID][originCat.ID].Cost = 0;
            this.Origins[jumperID][originCat.ID].Name = originCat.Def;
            this.Origins[jumperID][originCat.ID].Description = "";
        }
        return unusedID++;

    }

    RemoveOriginCategory(originCat){
        for(let jumperID in Chain.Characters){
            delete this.Origins[jumperID][originCat.ID];
        }
        delete this.OriginCategories[originCat.ID];
    }

    UpdateName(name){
        this.Name = name;
        if (this.NameRender){
            this.NameRender.nodeValue = name;
        }
    }

    get FieldList() {

        let drawbackExclusions = Chain.Drawbacks.map (
            (d) => {return {Text: d.Name, Value: d.ID}; }
        )

        return {
            Name: {InputType: "text", DataType: "String", Placeholder: "Name", Focus: "True"},
            Cost: {InputType: "number", DataType: "Integer", Placeholder: "Cost", Step: "50"},
            Description: {InputType: "textarea", DataType: "String", Placeholder: "Description"},
            Goals: {InputType: "textarea", DataType: "String"},
            Challenges: {InputType: "textarea", DataType: "String"},
            Accomplishments: {InputType: "textarea", DataType: "String"},
            Length_Years: {InputType: "number", DataType: "Integer", Step: "1"},
            Length_Months: {InputType: "number", DataType: "Integer", Step: "1"},
            Length_Days: {InputType: "number", DataType: "Integer", Step: "1"},
            URL: {InputType: "text", DataType: "String"},
            Supplement: {InputType: "checkbox", DataType: "Boolean"},
            ExcludedDrawbacks : { InputType: "multiselect", Options: drawbackExclusions, 
                Placeholder: "Exclusions", 
                DefaultSingle: false,
                Abbreviate: true, 
                Important: true }

        }    
    }

    RegisterPurchase(purchase){
        this.Purchases.push(purchase);
        purchase.ID = unusedID;
        purchase.JumpID = this.ID;
        return unusedID++;
    }

    RegisterAltForm(altForm) {
        this.PhysicalForms.push(altForm);
        altForm.ID = unusedID;
        altForm.JumpID = this.ID;
        return unusedID++;
    }

    RegisterDrawback(drawback){
        this.Drawbacks.push(drawback);
        drawback.ID = unusedID;
        drawback.JumpID = this.ID;
        return unusedID++;
    }

    RegisterCharacter(jumperID) {
        this.Origins[jumperID] = {};

        for (let oCategory in this.OriginCategories){
            this.Origins[jumperID][oCategory] = {};
            this.Origins[jumperID][oCategory].Cost = 0;
            this.Origins[jumperID][oCategory].Name = this.OriginCategories[oCategory].Def;
            this.Origins[jumperID][oCategory].Description = "";
        }

        this.SupplementInvestments[jumperID] = {};
        this.SupplementStipends[jumperID] = {};

        this.SubsystemAccess[jumperID] = {};
        this.BankDeposits[jumperID] = 0;

        for (let supp of Chain.Supplements) {
            this.SupplementInvestments[jumperID][supp.ID] = 0;
            this.SupplementStipends[jumperID][supp.ID] = 0
        }

        this.Budgets[jumperID] = {};
        this.Narratives[jumperID] = {Goals: "", Challenges: "", Accomplishments: ""};
        this.RenderLocation[jumperID] = {};
        this.StipendRenders[jumperID] = {};
        for (let c in this.Currencies) this.StipendRenders[jumperID][c] = {};
        this.UpdateBudgets(jumperID);
    }

    UnregisterCharacter(jumperID) {
        delete this.Origins[jumperID];
        delete this.SupplementInvestments[jumperID];
        delete this.SupplementStipends[jumperID];
        delete this.SubsystemAccess[jumperID];
        delete this.Budgets[jumperID];
        delete this.Budgets[jumperID];
        delete this.Narratives[jumperID];
        delete this.RenderLocation[jumperID];
        delete this.StipendRenders[jumperID];
        for (let i = 0; i < this.Purchases.length; i++) {
            let p = this.Purchases[i];
            
            if (p.JumperID == jumperID) {
                delete this.Purchases[i];
                i--;
            } 
            if (p.Type == PurchaseTypes.Companion && p.CompanionIDs.includes(+jumperID)) {
                p.CompanionIDs.splice(p.CompanionIDs.indexOf(+jumperID), 1);
            }

        }
    }


    CalculateBudget(jumperID){

        let budget = {};
        let jumper = Chain.Characters[jumperID];
        if (!jumper) return;
        let stipends = {};

        for (let c in this.Currencies){
            stipends[c] = {};
            budget[c] = 0;
            for (let subtype in this.PurchaseSubTypes){
                    if(jumper.Primary && this.PurchaseSubTypes[subtype].Currency == c){
                        stipends[c][subtype] = this.PurchaseSubTypes[subtype].Stipend;
                    } else {
                        stipends[c][subtype] = 0
                    }
                }
        }

        if(Chain.Bank.Enabled) budget[0] -= this.BankDeposits[jumperID];

        for (let sub in this.SubsystemAccess[jumper.ID]) {
            stipends[DP.ActiveJump.PurchaseSubTypes[sub].Currency][sub] += this.SubsystemAccess[jumper.ID][sub].Stipend;
        }

        for (let c in this.Currencies){
            if (jumper.Primary) {
                budget[c] += this.Currencies[c].Budget;
            }
        }

        for (let i in this.Drawbacks) {
            let drawback = this.Drawbacks[i];
            if (drawback.JumperID == jumperID){ 
                    if(drawback.Stipend.length == 0)
                        budget[drawback.Currency] += drawback.Cost;
                    else
                        stipends[drawback.Currency][subtype] += drawback.Cost;
                }
        }

        for (let supp in this.SupplementInvestments[jumperID]){
            budget[0] -= this.SupplementInvestments[jumperID][supp];
        }

        for (let oCategory in this.OriginCategories) {
            budget[0] -= this.Origins[jumperID][oCategory].Cost;
        }    
        

        let chainDrawbackTally = Chain.TallyDrawbacks(this);

        if (Chain.Characters[jumperID].Primary) {
            budget[0] += chainDrawbackTally.General;
            stipends[0][1] += chainDrawbackTally.Items;  
        } else {
            budget[0] += chainDrawbackTally.Companions;
        }

        if (!Chain.Characters[jumperID].Primary){
            for (let p of this.Purchases) {
                if (p.Type != PurchaseTypes.Companion) continue;
                if (!p.CompanionIDs.includes(+jumperID)) continue;
                for (let c in p.Allowances) {
                    budget[c] += p.Allowances[c];
                }
                for (let c in p.Stipends) {
                    for (let subtype in p.Stipends[c]){
                        stipends[c][subtype] += p.Stipends[c][subtype];
                    }
                }
            }
        }        

        for (let p of this.Purchases) {
            if (p.Type == PurchaseTypes.Supplement) continue;
            if (p.Type == PurchaseTypes.Subsystem 
                && !(p.Subtype in this.SubsystemAccess[jumperID])) continue;
            if (p.JumperID == jumperID){  
                let stipendCost = Math.min(stipends[p.Currency][p.Subtype], 
                    p.Cost);
                stipends[p.Currency][p.Subtype] -= stipendCost;
                budget[p.Currency] -= (p.Cost - stipendCost);
            }
        }

        return {Total: budget, Stipends: stipends};
    }

    UpdateBudgets(jumperID){
        if (jumperID in Chain.Characters == false) return;
        this.Budgets[jumperID] = this.CalculateBudget(jumperID);
        for (let c in this.Currencies){
            if (this.RenderLocation[jumperID][c]){
                this.RenderLocation[jumperID][c].nodeValue = this.Budgets[jumperID].Total[c];
            }
            for (let subtype in this.StipendRenders[jumperID][c]){
                if (this.Budgets[jumperID].Stipends[c][subtype] != 0){
                    this.StipendRenders[jumperID][c][subtype].nodeValue = this.Budgets[jumperID].Stipends[c][subtype];
                } else {
                    this.StipendRenders[jumperID][c][subtype].nodeValue = "";
                }
            }
        }

    }
}

class AltForm {
    constructor(jumperID) {
        this.ID = -1;
        this.JumperID = jumperID;
        this.JumpID = -1;
        this.Name = "";
        this.HeightInUnits = Math.floor(Math.random() * 18 + 60);
        this.WeightInUnits = 100 + Math.floor(Math.random() * 150);
        this.HeightImperial = true;
        this.WeightImperial = true;
        this.Sex = "Unknown";
        this.Species = "Human";
        this.PersonalDescription = "";
        this.Capabilities = "";
    }

    Deserialize(json) {
        Object.assign(this, json);
        return this;
    }

    get FieldList() {
        return {
            Name: {InputType: "text", DataType: "String"},
            Height: {InputType: "number", DataType: "Decimal", Step: "1"},
            Weight: {InputType: "number", DataType: "Decimal", Step: "1"},
            Sex: {InputType: "text", DataType: "String"},
            Species: {InputType: "text", DataType: "String"},
            PersonalDescription: {InputType: "textarea", DataType: "String", Placeholder:"Personal Physique"},
            Capabilities: {InputType: "textarea", DataType: "String"}
        }    
    }

    get Height(){
        if (!this.HeightInUnits) return 0;
        let imperial = localStorage.getItem("unitsImperial") == "true";
        if (imperial == this.HeightImperial){
            return truncate(this.HeightInUnits);
        }
        if (imperial) {
            return truncate(this.HeightInUnits / 2.54);
        }
        return truncate(this.HeightInUnits * 2.54);
    }

    set Height(height){
        this.HeightImperial = localStorage.getItem("unitsImperial") == "true";
        this.HeightInUnits = height;
    }

    get Jump(){
        return Chain.Jump(this.JumpID);
    }

    get Weight(){
        if (!this.WeightInUnits) return 0;
        let imperial = localStorage.getItem("unitsImperial") == "true";
        if (imperial == this.HeightImperial) {
            return truncate(this.WeightInUnits);
        }
        if (imperial) {
            return truncate(this.WeightInUnits / 0.4536);
        }
        return truncate(this.WeightInUnits * 0.4536);
    }

    set Weight(weight){
        this.WeightImperial = localStorage.getItem("unitsImperial") == "true";
        this.WeightInUnits = weight;
    }

    Unregister(){
        let jump = Chain.Jump(this.JumpID);
    
        jump.PhysicalForms.splice(jump.PhysicalForms.indexOf(this), 1);
        jump.UpdateBudgets(this.JumperID);
    }

}

const CompanionAccess = {
    Unavailable: 0,
    Available: 1,
    Communal: 2
}

class ChainSupplement {
    constructor() {
        this.Name = "[untitled supplement]";
        this.InvestmentRatio = 100;
        this.MaxInvestment = 0;
        this.InitialStipend = 0;
        this.PerJumpStipend = 0;
        this.CompanionAccess = CompanionAccess.Available;
        this.Currency = "SP";
        this.URL = "";
        this.PurchaseCategories = [];
        this.ItemLike = false;
    }

    Deserialize(json) {
        Object.assign(this, json);
        return this;
    }

    Unregister(){
        Chain.Supplements.splice(Chain.Supplements.indexOf(this), 1);

        for (let char in this.Characters){
            for (let jump of this.Jumps) {
                delete jump.SupplementInvestments[char][supp.ID];
                delete jump.SupplementStipends[char][supp.ID];
            }    
        }
    }

    get FieldList() {
        return {
            Name: {InputType: "text", DataType: "String"},
            Currency: {InputType: "text", DataType: "String"},
            URL: {InputType: "text", DataType: "String"},
            InitialStipend: {InputType: "number", DataType: "Integer", Step: "50"},
            InvestmentRatio: {InputType: "number", DataType: "Integer", Step: "10"},
            MaxInvestment: {InputType: "number", DataType: "Integer", Step: "50"},
            PerJumpStipend: {InputType: "number", DataType: "Integer", Step: "50"},
            CompanionAccess: {InputType: "select", Options: [
                {Text: "Restricted to primary Jumper(s)", Value: CompanionAccess.Unavailable},
                {Text: "Available to companions", Value: CompanionAccess.Available},
                {Text: "Purchases shared between Jumper and companions", Value: CompanionAccess.Communal},
            ]},
            ItemLike: {InputType: "select", Options: [
                {Text: "Item Supplement", Value: true},
                {Text: "Perk Supplement", Value: false}
            ]},
        }    
    }
}

class Note {
    constructor(title, text) {
        this.Title = title;
        this.Text = text;
    }

    Deserialize(json) {
        Object.assign(this, json);
        return this;
    }

    get FieldList() {
        return {
            Title: {InputType: "text", DataType: "String"},
            Text: {InputType: "textarea", DataType: "String"}
        }
    }

    Unregister(){
        Chain.Notes.splice(Chain.Notes.indexOf(this), 1);
    }
}