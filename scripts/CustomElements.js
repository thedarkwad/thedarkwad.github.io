class CheckBoxSelect {
    constructor(label, single = true, fullList = false, defaultSingle = true, forceEdit = false){
        this.Container = E("div", {class: "checkboxselect hidden"});
        this.Head = E("span", {class: "head"});
        this.Expand = E("a", {
            href: "javascript:void(0);", 
            class: `icon button expand small alt`
        });

        if (fullList) {
            this.Container.classList.add("fullList");
        }

        this.Single = single;
        this.DefaultSingle = defaultSingle;
        this.FullList = fullList;

        if (DP.Editable || forceEdit)
            this.Head.addEventListener("click", () => {
                if (this.IsOpen) this.Close();
                else this.Open();
            });
        else
            this.Head.classList.add("disabled");
        this.DefaultText = label;
        this.Label = T(label);
        this.Body = E("div", {class: "body"});
        
        if(fullList){
            this.Head.append(E("span", {class:"label"}, T(label + ": ")));
        }
        this.Head.append(this.Label, this.Expand);
        this.Container.append(this.Head, this.Body);
        this.Options = [];

        this.IsOpen = false;

        this.Selected = [];

        this.CloseListener = (e) => {
            if(!this.Container.contains(e.target)) this.Close();
        }
    
    
    }

    Close() {
        this.IsOpen = false;
        this.Expand.classList.add("expand"); this.Expand.classList.remove("collapse");
        this.Container.classList.add("hidden");
        window.removeEventListener("click", this.CloseListener);
        if("InputListener" in this) this.InputListener();
    }

    Open(){
        this.IsOpen = true;
        this.Expand.classList.remove("expand"); this.Expand.classList.add("collapse");
        this.Container.classList.remove("hidden");
        window.addEventListener("click", this.CloseListener);
    }


    AddOption(text, value, def = false, title = ""){
        let optionDOM = E("div", {class: "option"},
            E("div", {class: "checkbox"}),
            E("span", {class: "vcentered"}, T(text)));
        if (title.length > 0) {
            optionDOM.setAttribute("title", title);
        }
        let o = {DOM:optionDOM, Value:value, Text:text} ;
        optionDOM.addEventListener("click", (e) => {
            let i = this.Selected.indexOf(o);
            if(this.Single 
                || (this.DefaultSingle && !e.ctrlKey && !e.metaKey && (this.Selected.length != 1 || i < 0))) {
                for(let o of this.Options) {
                    o.DOM.classList.remove("selected");
                }
                this.Selected = [];
            }
            i = this.Selected.indexOf(o);
            if (i < 0) {this.Selected.push(o);}
            else {this.Selected.splice(i, 1);}
            optionDOM.classList.toggle("selected");
            this.UpdateLabel();
        });
        if (def) {optionDOM.classList.add("selected"); this.Selected.push(o)}; 
        this.Body.append(optionDOM)
        this.Options.push(o);
        this.UpdateLabel();
    }

    addInputListener(fun){
        this.InputListener = fun;
    }

    //stupid! I should probably implement all the different events
    addEventListener(event, fun) {
        this.addInputListener(fun);
    }

    UpdateLabel() {
        if ("InputListener" in this) this.InputListener();
        if (this.Selected.length == 0) {
            this.Label.nodeValue = (this.FullList)?"None":this.DefaultText;
            return;
        }
        if (this.Selected.length == 1){
            this.Label.nodeValue = this.Selected[0].Text;
            return;
        }
        if (!this.FullList) {
            if (this.Selected.length == 2) {
                this.Label.nodeValue = this.Selected[0].Text + " & " + this.Selected[1].Text;
            } else {
                this.Label.nodeValue = "Multi-" + this.DefaultText;
            }
            return;
        }
        let text = this.Selected[0].Text;
        for(let i = 1; i < this.Selected.length; i++){
            text += ", " + this.Selected[i].Text;
        }
        this.Label.nodeValue = text;
    }
    
    get value(){
        let values = [];
        for(let o of this.Selected){
            if (this.Single) return o.Value;
            values.push(o.Value);
        }
        return values;
    }

    set value(val){
        this.Selected = [];
        if(this.Single) val = [val];
        for(let o of this.Options) {
            if (val.includes(o.Value)) {o.DOM.classList.add("selected"); this.Selected.push(o);}
            else {o.DOM.classList.remove("selected");}
        }
        this.UpdateLabel();
    }

    setAttribute(attr, value){
        this.Container.setAttribute(attr, value)
    }

    get DOM(){
        return this.Container;
    }
}

class MultiNumeric {
    constructor(label){
        this.Container = E("div", {class: "checkboxselect hidden"});
        this.Head = E("span", {class: "head"});
        this.Expand = E("a", {
            href: "javascript:void(0);", 
            class: `icon button expand small alt`
        });
        if (DP.Editable)
            this.Head.addEventListener("click", () => {
                if (this.IsOpen) this.Close();
                else this.Open();
            });
        else
            this.Head.classList.add("disabled");
        this.Label = T(label);
        this.Body = E("div", {class: "numeric body"});
        
        if(label.length > 0)
            this.Head.append(E("span", {class:"label"}, T(label + ": ")));

        this.Head.append(this.Label, this.Expand);
        this.Container.append(this.Head, this.Body);
        this.Options = [];

        this.IsOpen = false;

        this.Selected = [];

        this.CloseListener = (e) => {
            if(!this.Container.contains(e.target)) this.Close();
        }    
    }

    Close() {
        this.IsOpen = false;
        this.Expand.classList.add("expand"); this.Expand.classList.remove("collapse");
        this.Container.classList.add("hidden");
        window.removeEventListener("click", this.CloseListener);

        for(let i = 0; i < this.Selected.length; i++) {
            let o = this.Selected[i];
            if (o.Input.value == 0) {
                this.Selected.splice(i, 1);
                o.DOM.classList.remove("selected");
                o.Input.setAttribute("disabled", "disabled");
                i--;
            }
        }

    }

    Open() {
        this.IsOpen = true;
        this.Expand.classList.remove("expand"); this.Expand.classList.add("collapse");
        this.Container.classList.remove("hidden");
        if(this.Selected.length > 0) this.Selected[0].Input.focus();
        window.addEventListener("click", this.CloseListener);
    }

    AddOption(text, field, def){
        let optionDOM = E("div", {class: "option"},
            E("div", {class: "checkbox"}),
            E("span", {class: "vcentered"}, 
                T(`${text}: `)));
        let NumericEntry = E("input", {type: "number", step: "50", value: def});
        optionDOM.append(NumericEntry);
        let o = {DOM: optionDOM, Input: NumericEntry, Field:field, Text:text} ;
        optionDOM.addEventListener("click", (e) => {
            if (e.target.tagName == "INPUT") return;
            let i = this.Selected.indexOf(o);
            optionDOM.classList.toggle("selected");
            if (i < 0) {
                this.Selected.push(o);
                NumericEntry.removeAttribute("disabled");
                NumericEntry.focus(); 
            } else {
                NumericEntry.setAttribute("disabled", "disabled");
                this.Selected.splice(i, 1);
            }
            this.UpdateLabel();
        });
        NumericEntry.addEventListener("input", () => { this.UpdateLabel(); });
        if (def) {optionDOM.classList.add("selected"); this.Selected.push(o)}
        else {NumericEntry.setAttribute("disabled", "disabled")}; 
        this.Body.append(optionDOM)
        this.Options.push(o);
        this.UpdateLabel();
    }

    UpdateLabel(){
        let values = this.Selected.filter( (o) => o.Input.value != 0 );
        if (values.length == 0) {
            this.Label.nodeValue = "None";
            return;
        }
        if (values.length == 1){
            this.Label.nodeValue = values[0].Text + ": " + values[0].Input.value;
            return;
        }
        let text = values[0].Text + ": " + values[0].Input.value;
        for(let i = 1; i < values.length; i++){
            text += ", " + values[i].Text + ": " + values[i].Input.value;
        }

        this.Label.nodeValue = text;
    }
    
    get value(){
        let values = {};
        for(let o of this.Selected){
            if (o.Input.Value != 0)
                values[o.Field] = Math.floor(o.Input.value);
        }
        return values;
    }

    set value(val){
        this.Selected = [];
        for(let o of this.Options) {
            if (o.Field in val) {
                o.Input.val = val[o.Field];
            } else {
                o.Input.value = 0;
            }
            if (o.Input.value != 0){
                o.DOM.classList.add("selected");
                o.Input.removeAttribute("disabled");
                this.Selected.add(o);
            } else {
                o.DOM.classList.remove("selected");
                o.Input.setAttribute("disabled", "disabled");
            }
        }
        this.UpdateLabel();
    }

    setAttribute(attr, value){
        this.Container.setAttribute(attr, value)
    }

    get DOM(){
        return this.Container;
    }
}

class OptionalNumeric {
    constructor(inactiveLabel, activeLabel, def = -1){
        this.Container = E("div", {class: "checkboxselect hidden"});
        this.Head = E("span", {class: "head"});
        this.Expand = E("a", {
            href: "javascript:void(0);", 
            class: `icon button expand small alt`
        });

        if (DP.Editable)
            this.Head.addEventListener("click", () => {
                if (this.IsOpen) this.Close();
                else this.Open();
            });
        else
            this.Head.classList.add("disabled");

        this.Label = T(inactiveLabel);
        this.Body = E("div", {class: "numeric body"});
        
        this.Head.append(this.Label, this.Expand);
        this.Container.append(this.Head, this.Body);

        this.IsOpen = false;
        this.Selected = def > 0;

        this.InactiveLabel = inactiveLabel;
        this.ActiveLabel = activeLabel;

        this.InactiveDOM = E("div", {class: "option"},
            E("div", {class: "checkbox"}),
            E("span", {class: "vcentered"}, 
                T(inactiveLabel))
        );

        this.ActiveDOM = E("div", {class: "option"},
        E("div", {class: "checkbox"}),
        E("span", {class: "vcentered"}, 
            T(`${activeLabel}: `)));
        this.NumericEntry = E("input", {type: "number", step: "1", value: (def > 0) ? def : 0});
        this.ActiveDOM.append(this.NumericEntry);

        this.InactiveDOM.addEventListener("click", (e) => {
            this.Selected = false;
            this.InactiveDOM.classList.add("selected");
            this.ActiveDOM.classList.remove("selected");
            this.NumericEntry.setAttribute("disabled", "disabled");
            this.UpdateLabel();
        });

        this.ActiveDOM.addEventListener("click", (e) => {
            this.Selected = true;
            this.InactiveDOM.classList.remove("selected");
            this.ActiveDOM.classList.add("selected");
            this.NumericEntry.removeAttribute("disabled");
            this.NumericEntry.focus();
            this.UpdateLabel();
        });

        this.NumericEntry.addEventListener("input", () => {
            this.NumericEntry.value = Math.max(this.NumericEntry.value, 0);
            this.UpdateLabel();
        });

        this.Body.append(this.InactiveDOM, this.ActiveDOM);

        ((this.Selected) ? this.ActiveDOM : this.InactiveDOM).classList.add("selected");

        this.CloseListener = (e) => {
            if(!this.Container.contains(e.target)) this.Close();
        }    
    }

    Close() {
        this.IsOpen = false;
        this.Expand.classList.add("expand"); this.Expand.classList.remove("collapse");
        this.Container.classList.add("hidden");
        window.removeEventListener("click", this.CloseListener);

        if (this.NumericEntry.value <= 0) {
            this.Selected = false;
            this.InactiveDOM.classList.add("selected");
            this.ActiveDOM.classList.remove("selected");
            this.NumericEntry.setAttribute("disabled", "disabled");
        }

    }

    Open() {
        this.IsOpen = true;
        this.Expand.classList.remove("expand"); this.Expand.classList.add("collapse");
        this.Container.classList.remove("hidden");
        if(this.Selected) this.NumericEntry.focus();
        window.addEventListener("click", this.CloseListener);
    }

    UpdateLabel() {
        this.Label.nodeValue = 
            (this.Selected && this.NumericEntry.value > 0) ? `${this.ActiveLabel}: ${this.NumericEntry.value}` : this.InactiveLabel;
    }
    
    get value() {
        return (this.Selected) ? this.NumericEntry.value : -1;
    }

    set value(val){
        if (val > 0) {
            this.Selected = true;
            this.InactiveDOM.classList.remove("selected");
            this.ActiveDOM.classList.add("selected");
            this.NumericEntry.removeAttribute("disabled");
            this.NumericEntry.value = val;
        } else {
            this.Selected = false;
            this.InactiveDOM.classList.add("selected");
            this.ActiveDOM.classList.remove("selected");
            this.NumericEntry.setAttribute("disabled", "disabled");
            this.NumericEntry.value = 0;
        }
        this.UpdateLabel();
    }

    setAttribute(attr, value){
        this.Container.setAttribute(attr, value)
    }

    get DOM(){
        return this.Container;
    }
}

class ComplexConfigMenu {
    constructor(label, fieldList, list, newElementFunction, deleteFunction, updateCallback, draggable = true){
        this.FieldList = fieldList;
        this.List = list;
        this.New = newElementFunction;
        this.Delete = deleteFunction;
        this.UpdateCallback = updateCallback;
        this.Label = label;
        this.Draggable = draggable;

        this.Container = E("div", {class:"complexconfig"}, 
            E("div", {class: "label"}, T(label)), 
            E("div", {class: "hrule"})
        );

        this.EntriesContainer = E("div", {class: "list"});
        
        this.Entries = {};
        this.OpenEntry = undefined;
        for (let i in list) {
            this.AddEntry(i);
        }

        let newButton;
        if (DP.Editable) {
            newButton = E("a", {class:"icon button new smallish alt", href:"javascript:void(0);"});
            newButton.addEventListener("click", () => {
                let i = this.New();
                this.AddEntry(i);
                this.UpdateCallback(this.List[i]);            
            });    
        } else {
            newButton = E("span");
        }
        this.Container.append(this.EntriesContainer, 
            E("div", {class: "button_row", style: {marginRight:"0.5rem"}}, 
                newButton
            )
        );

        this.CloseListener = (e) => {
            if(!this.OpenEntry.DOM.contains(e.target)) this.Close();
        }

    }

    CreateInput(field) {
        if (!this.FieldList[field].InputType.includes("select")) {
            let input = E(
                (field.InputType == "textarea")?"textarea":"input", 
                {id: `complex_${field}`, type: this.FieldList[field].InputType});    
            if (!DP.Editable) input.setAttribute("disabled", "disabled");
            return input;
        }
        let input;
        switch (this.FieldList[field].InputType) {
            case "select":
                input = new CheckBoxSelect("", true); break;
            case "multiselect":
                break;
        }

        for (let o of this.FieldList[field].Options) {
            input.AddOption(o.Text, o.Value);
        }

        return input;

    }

    Open(entry) {
        window.addEventListener("click", this.CloseListener);
        for (let field in this.FieldList) {
            if (entry.Item.Locked && entry.Item.Locked.includes(field)) continue;
            if (this.FieldList[field].InputType == "checkbox") {
                entry.Inputs[field].checked = !!entry.Item[field];
                continue;
            }            
            entry.Inputs[field].value = entry.Item[field];
        }
        this.OpenEntry = entry;
        entry.DOM.classList.remove("hidden");
        for (let i in entry.Inputs) {
            entry.Inputs[i].focus();
            break;
        }
    }

    Close() {
        window.removeEventListener("click", this.CloseListener);
        if (this.OpenEntry !== undefined) {
            this.OpenEntry.DOM.classList.add("hidden");
        }
        this.OpenEntry = undefined;
    }

    get DOM(){
        return this.Container;
    }

    AddEntry(index){
        let item = this.List[index];
        if (item.Hidden) return;
        let newEntryDOM = E("div", {class: "complexentry hidden"});
        let label = T(item.Name);
        let head = E("div", {class: "complexhead"}, 
            label, 
            E("a", {class:"icon button expand small alt", href:"javascript:void(0);"})
        );
        newEntryDOM.append(head);

        let body = E("form", {class: "complexbody", autocomplete: "off", onSubmit: "return false;"});
        let inputs = {};
        for (let field in this.FieldList) {
            let fieldInfo = this.FieldList[field];
            if (item.Locked && item.Locked.includes(field)) continue;
            body.append(
                E("span", {class: "label vcentered"}, 
                    T(((fieldInfo.Placeholder)? fieldInfo.Placeholder : field) + ":")
                )
            );
            let input = this.CreateInput(field);
            if (this.FieldList[field].Step) input.setAttribute("step", this.FieldList[field].Step);
            input.addEventListener("input", () => {
                let oldField = item[field];
                let change = {};
                change[field] = oldField;
                if (this.FieldList[field].InputType == "checkbox") {
                    item[field]  = entry.Inputs[field].checked;
                } else {
                    item[field] = input.value;
                }                

                if (this.FieldList[field].DataType == "Integer") {
                    item[field] = Math.floor(item[field]);
                }

                this.UpdateCallback(item, change);
            });
            if (field == "Name") {
                input.addEventListener("input", () => {
                    label.nodeValue = input.value;
                });       
            }
            inputs[field] = input;
            if (this.FieldList[field].InputType.includes("select")) body.append(input.DOM);
            else body.append(input);
        }
        newEntryDOM.append(body);
        let entry = {Item: item, Inputs: inputs, Label: label, DOM: newEntryDOM};
        head.addEventListener( "click", () => {
            if (this.OpenEntry != entry) {
                this.Close();
                this.Open(entry);
            } else {
                this.Close();
            }
        }
        );

        if (!item.Essential && DP.Editable){
            let deleteButton = E("a", {class:"icon button delete small alt", href:"javascript:void(0);"});
            let buttonRow = E("div", {class: "button_row", style: {marginRight:"0.5rem", gridColumn:"2"}}, 
                deleteButton
            );
            deleteButton.addEventListener("click", () => {
                this.Delete(item);
                newEntryDOM.remove();
                delete this.Entries[index];
                this.Close();
                this.UpdateCallback();
            });
            body.append(buttonRow);  
        }  
        
        this.Entries[index] = entry;
        this.EntriesContainer.append(newEntryDOM);

        if("indexOf" in this.List && this.Draggable){
            addReorderEventListeners(newEntryDOM, item, this.List, this.Label);
        } 
        
    }
}
