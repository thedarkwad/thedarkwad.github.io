const DiffTypes = {
    Delete: 0, 
    Replace: 1, 
    Modify: 2
};

function getDiff(a, b) {

    if(typeof a != "object" || typeof b != "object")
        return [DiffTypes.Replace, b];

    let diff = {};
    let keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (let key of keys) {

        if ((key in a) && !(key in b)) {
            // if (!Array.isArray(b) || b.length == key)
                diff[key] = [DiffTypes.Delete]; 
            continue;
        }

        if(!(key in a) && (key in b)) {
                diff[key] = [DiffTypes.Replace, b[key]]; 
                continue;
        }

        if (JSON.stringify(a[key]) == JSON.stringify(b[key])) continue;

        if (typeof a[key] != "object" || typeof b[key] != "object")
            diff[key] = [DiffTypes.Replace, b[key]];
        else if ((Array.isArray(b) && !Array.isArray(a)) || (Array.isArray(a) && !Array.isArray(b)))
            diff[key] = [DiffTypes.Replace, b[key]];
        else
            diff[key] = [DiffTypes.Modify, getDiff(a[key], b[key])]; 
    }

    return diff;
}

function applyDiff(a, diff){
    for (let key in diff) {
        switch (diff[key][0]) {
            case DiffTypes.Delete:
                if (Array.isArray(a))
                    a.splice(key);
                else
                    delete a[key]; 
                break;
            case DiffTypes.Replace:
                a[key] = diff[key][1]; 
                break;
            case DiffTypes.Modify:
                applyDiff(a[key], diff[key][1]); 
                break;
        }
    }
}