/*
the basic idea:
- use 2 range inputs,
- right on top of left,
- restrict their min/max values depending on each other,
- make original handle alpha 0,
- draw another handle at same position (quasi on top),
  which ignores pointer events, making them go to the original handle.

Caveat: the pos-calc of the handle on top
has to match how the slider does it internally.
*/


const template = document.createElement('template')


template.innerHTML = `<div class="container">
    <div class="slider-track"></div>
    <input type="range" id="sliderL"></input>
    <input type="range" id="sliderR"></input>
    <div id="thumbtopL" class="thumbtop"></div>
    <div id="thumbtopR" class="thumbtop"></div>
</div>
`

function getCSS(thumbWidthInPixel) {
    return `<style>
    .container{
        position: relative;
        width: 100%;
    }

    /* put sliderR on top of sliderL */

    input[type="range"]{
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        width: 100%;
        outline: none;
        position: absolute;
        margin: auto;
        top: 0;
        bottom: 0;
        background-color: transparent;
        pointer-events: none;
    }

    /* the tracks */

    .slider-track{
        width: 100%;
        height: 5px;
        position: absolute;
        margin: auto;
        top: 0;
        bottom: 0;
        border-radius: 5px;
    }
    input[type="range"]::-webkit-slider-runnable-track{
        -webkit-appearance: none;
        height: 5px;
    }
    input[type="range"]::-moz-range-track{
        -moz-appearance: none;
        height: 5px;
    }
    input[type="range"]::-ms-track{
        appearance: none;
        height: 5px;
    }

    /* the original handles/thumbs */

    input[type="range"]::-webkit-slider-thumb{
        -webkit-appearance: none;
        height: 30px;
        width: ${thumbWidthInPixel}px;
        margin-top: -14px;
        background-color: transparent;
        cursor: pointer;
        pointer-events: auto;       /* mind those when debugging; */
    }
    input[type="range"]::-moz-range-thumb{
        -webkit-appearance: none;
        height: 30px;
        width: ${thumbWidthInPixel}px;
        margin-top: -14px;
        background-color: transparent;
        cursor: pointer;
        pointer-events: auto;
    }
    input[type="range"]::-ms-thumb{
        appearance: none;
        height: 30px;
        width: ${thumbWidthInPixel}px;
        margin-top: -14px;
        background-color: transparent;
        cursor: pointer;
        pointer-events: auto;
    }

    /* the handles/thumbs on top of the original */

    .thumbtop {
        position: absolute; 
        width: ${thumbWidthInPixel}px;
        height: 30px;
        margin-top: -18px; 
        background-color: white;
        border: 3px solid black;
        border-radius: 10px;
        pointer-events: none; 
        text-align: center;
        line-height: 30px;  /* trick to v-center text */
    }
    #thumbTopL {
        left: 0px;
    }
    #thumbtop2 {
        right: 0px; 
    }

    </style>`
}


class Element extends HTMLElement {

    #_sliderL
    #_sliderR
    #_thumbTopL
    #_thumbTopR
    #_minGap        // sliders can't get closer together than this; unit is [value]
    #_sliderTrack
    #_isLocked

	constructor() {
		super()

        let thumbWidthInPixel = 20
        if(this.hasAttribute("thumbWidthInPixel")) {
            thumbWidthInPixel = Number(this.getAttribute("thumbWidthInPixel"))
        }
        template.innerHTML += getCSS(thumbWidthInPixel)

		this.attachShadow({ mode: 'open' })
		this.shadowRoot.appendChild(template.content.cloneNode(true))

        this.#_minGap = 1
        this.#_isLocked = false

        this.#_sliderL = this.shadowRoot.getElementById("sliderL")
        this.#_sliderR = this.shadowRoot.getElementById("sliderR")
        this.#_thumbTopL = this.shadowRoot.getElementById("thumbtopL")
        this.#_thumbTopR = this.shadowRoot.getElementById("thumbtopR")
        this.#_sliderTrack = this.shadowRoot.querySelector(".slider-track")

        this.#_sliderL.addEventListener('input', (event) => { this.#slideL(); this.#fireDragging() })
        this.#_sliderR.addEventListener('input', (event) => { this.#slideR(); this.#fireDragging() })
        this.#_sliderL.addEventListener('mouseup', (event) => { this.#fireSelected() })
        this.#_sliderR.addEventListener('mouseup', (event) => { this.#fireSelected() })
        this.#_sliderL.addEventListener('touchend', (event) => { this.#fireSelected() })
        this.#_sliderR.addEventListener('touchend', (event) => { this.#fireSelected() })
        this.#_sliderL.addEventListener("keyup", ke => {
            if(this.#_isLocked) {return}
            if(ke.code.startsWith("Arrow")) {
				this.#fireDragging(); this.#fireSelected()
			}
		})
        this.#_sliderR.addEventListener("keyup", ke => {
            if(this.#_isLocked) {return}
            if(ke.code.startsWith("Arrow")) {
				this.#fireDragging(); this.#fireSelected()
			}
		})

        window.addEventListener('resize', () => {
            this.#placeThumbTop(this.#_sliderL, this.#_thumbTopL)
            this.#placeThumbTop(this.#_sliderR, this.#_thumbTopR)
        });
    }

	static get observedAttributes() {
		return ["min", "max", "mingap", "valuel", "valuer", "textl", "textr"]
	}

	attributeChangedCallback(name, oldVal, newVal) {
        //console.log(name,newVal)
        switch(name) {
            case "min":
                this.#_sliderL.min = Number(newVal)
                this.#_sliderR.min = Number(newVal)
                this.#update()
                break
            case "max":
                this.#_sliderL.max = Number(newVal)
                this.#_sliderR.max = Number(newVal)
                this.#update()
                break
            case "mingap":
                this.#_minGap = Number(newVal)
                this.#update()
                break
            case "valuel":
                const b = Number(newVal)
                this.#_sliderL.value = b
                this.#update()
                break
            case "valuer":
                this.#_sliderR.value = Number(newVal)
                this.#update()
                break
            case "textl":
                this.#_thumbTopL.textContent = newVal
                break
            case "textr":
                this.#_thumbTopR.textContent = newVal
                break
            default:
                console.debug("range: no such attribute " + name)
        }
    
	}

    connectedCallback() {
	}

    #update() {
        this.#slideL()
        this.#slideR()
        this.#fireDragging()
        this.#fireSelected()
    }

    get valuel() { return this.#_sliderL.value }
    get valuer() { return this.#_sliderR.value }

    #slideL(){
        if(parseInt(this.#_sliderR.value) - parseInt(this.#_sliderL.value) <= this.#_minGap){
            this.#_sliderL.value = parseInt(this.#_sliderR.value) - this.#_minGap;
            //console.log("slide l correction", this.#_sliderL.value)
        }
        this.#colorizeTrack();
        this.#placeThumbTop(this.#_sliderL, this.#_thumbTopL)
    }

    #slideR(){
        if(parseInt(this.#_sliderR.value) - parseInt(this.#_sliderL.value) <= this.#_minGap){
            this.#_sliderR.value = parseInt(this.#_sliderL.value) + this.#_minGap;
            //console.log("slide r correction", this.#_sliderL.value)
        }
        this.#colorizeTrack();
        this.#placeThumbTop(this.#_sliderR, this.#_thumbTopR)
    }
    
    #colorizeTrack(){
        const percent1 = (this.#_sliderL.value / this.#_sliderL.max) * 100;
        const percent2 = (this.#_sliderR.value / this.#_sliderR.max) * 100;     // assume L.max == R.max
        this.#_sliderTrack.style.background = `linear-gradient(to right, #dadae5 ${percent1}% , black ${percent1}% , black ${percent2}%, #dadae5 ${percent2}%)`;
    }

    /*
    |---------|---------|---------|     range (3 sections, 4 settings)
    |--|     |--|     |--|     |--|     thumb positions (w/ gaps)
    <-------><-------><-------><---     left positions of thumbWidth+gapWidth
    
     thumbWidthTot.
    |--||--||--||--|<-gapWdthTot-->
    */
    #placeThumbTop(slider, thumb) {
        const nbrSections = (slider.max-slider.min)
        const nbrSettings = nbrSections+1
        const thumbWidth = thumb.getBoundingClientRect( ).width
        const thumbWidthTotal = nbrSettings * thumbWidth
        const gapWidthTotal = slider.getBoundingClientRect().width - thumbWidthTotal
        const gapWidth = gapWidthTotal/nbrSections
        const absValue = (slider.value-slider.min)
        const x = (thumbWidth + gapWidth) * absValue

        thumb.style.left = x +"px"
    }

    getIndices() {
        return {
            startIdx: Number.parseInt(this.#_sliderL.value),
            endIdx: Number.parseInt(this.#_sliderR.value)
        }
    }

    #fireDragging() {
        if(this.#_isLocked) {return}

        this.dispatchEvent(
            new CustomEvent("dragging", { 
                composed: true,
                detail: this.getIndices() 
            })
          );
    }

    #fireSelected() {
        if(this.#_isLocked) {return}

        this.dispatchEvent(
            new CustomEvent("selected", { 
                composed: true,
                detail: this.getIndices()
            })
          );
    }

    store() {}
    restore() {}    // TODO

    setLocked(isLocked) {
        this.#_isLocked = isLocked
        this.#_thumbTopL.style.pointerEvents = isLocked ? "auto" : "none"
        this.#_thumbTopR.style.pointerEvents = isLocked ? "auto" : "none"
    }
}

window.customElements.define('range-slider', Element)
