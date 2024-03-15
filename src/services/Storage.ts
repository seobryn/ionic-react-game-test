export function addItem<T>(key: string, item: T){
    localStorage.setItem(key, JSON.stringify({value:item}))
}

export function removeItem(key: string) {
    localStorage.removeItem(key)
}

export function getItem<T>(key: string): T | null {
    const data = localStorage.getItem(key)
    if(data !== null ){
        return JSON.parse(data).value as T
    }

    return null
}

export function clearStorage() {
    localStorage.clear()
}