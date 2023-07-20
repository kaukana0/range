# range slider

it has 2 handles for min and max.
there's also a "single" mode w/ just 1 handle.

## single mode

the right one is still there but it's "disabled" (no events, no visuals).
so, only the left handle is to be used.

# example

    <range-slider id="myRange" thumbWidthInPixel="130" style="width: 100%; display: none;"></range-slider>
    
    const el = ...
    el.setAttribute("min", 2015)
    el.setAttribute("max", 2023)
    el.setAttribute("valuer", 2020)         // first right, because it's bigger and they depend on one another (via mingap)
    el.setAttribute("valuel", 2018)
    el.setAttribute("mingap",2)
    el.addEventListener('dragging', (e) => {        // event driven
        el.setAttribute("textl", e.detail.startIdx)
        el.setAttribute("textr", e.detail.endIdx)
    })
    el.addEventListener('selected', (e)=>console.log(e))
    
    console.log(el.valuel, el.valuer)                // imperatively
