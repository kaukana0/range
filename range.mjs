/*
the basic idea:
use 2 range inputs,
restrict their min/max values depending on each other,
make original handle alpha 0,
draw another handle on top which ignores pointer events.

Caveat: the calc of the pos has to match how slider does it internally.
*/


const template = document.createElement('template')


template.innerHTML = `<div class="container">
    <div class="slider-track"></div>
    <input type="range" min="1" max="100" value="20" id="sliderL">
    <input type="range" min="1" max="100" value="80" id="sliderR">
    <div id="thumbtopL" class="thumbtop"></div>
    <div id="thumbtopR" class="thumbtop"></div>
</div>
`

function getCSS(thumbWidthInPixel) {
    return `<style>
    .container{
        position: relative;
        width: 100%;
        height: 100px;
        //margin-top: 30px;
    }


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


    input[type="range"]::-webkit-slider-thumb{
        -webkit-appearance: none;
        height: 30px;
        width: ${thumbWidthInPixel}px;
        background-color: #0000FF88;
        //background-color: #ffffff;
        //border: 3px solid black;
        cursor: pointer;
        margin-top: -12px;
        pointer-events: auto;
        border-radius: 10%;
    }
    input[type="range"]::-moz-range-thumb{
        -webkit-appearance: none;
        height: 1.7em;
        width: 1.7em;
        cursor: pointer;
        //border-radius: 50%;
        background-color: #3264fe;
        //pointer-events: auto;
    }
    input[type="range"]::-ms-thumb{
        appearance: none;
        height: 1.7em;
        width: 1.7em;
        cursor: pointer;
        //border-radius: 50%;
        background-color: #3264fe;
        //pointer-events: auto;
    }
    input[type="range"]:focus::-webkit-slider-thumb{
        background-color: yellow;
    }

    .thumbtop {
        position: absolute; 
        width: ${thumbWidthInPixel}px;
        height: 30px; 
        top: 36px; 
        background-color: #fff;
        pointer-events: none; 
        //background-color: #ffffff;
        border: 3px solid black;
        border-radius: 10px;
    }
    #thumbTopL {
        left: 0px; 
    }
    #thumbTopL:focus {
        background-color: yellow;
    }
    #thumbtop2 {
        right: 0px; 
    }

    //input[type="range"]:active::-webkit-slider-thumb{
    //    background-color: #ffffff;
    //    border: 3px solid #3264fe;
    //}
    </style>`
}


class Element extends HTMLElement {

    #_sliderL
    #_sliderR
    #_thumbTopL
    #_thumbTopR
    #_minGap
    #_sliderTrack

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

        this.#_sliderL = this.shadowRoot.getElementById("sliderL")
        this.#_sliderR = this.shadowRoot.getElementById("sliderR")
        this.#_thumbTopL = this.shadowRoot.getElementById("thumbtopL")
        this.#_thumbTopR = this.shadowRoot.getElementById("thumbtopR")
        this.#_sliderTrack = this.shadowRoot.querySelector(".slider-track")

        this.#_sliderL.addEventListener('input', (event) => { this.#slideL(); this.#fire() })
        this.#_sliderR.addEventListener('input', (event) => { this.#slideR(); this.#fire() })
    }

	static get observedAttributes() {
		return ["min", "max", "mingap", "valuel", "valuer", "textl", "textr"]
	}

	attributeChangedCallback(name, oldVal, newVal) {
        let slide = false
        switch(name) {
            case "min":
                this.#_sliderL.min = Number(newVal)
                this.#_sliderR.min = Number(newVal)
                break
            case "max":
                this.#_sliderL.max = Number(newVal)
                this.#_sliderR.max = Number(newVal)
                break
            case "mingap":
                this.#_minGap = Number(newVal)
                break
            case "valuel":
                this.#_sliderL.value = Number(newVal)
                slide = true
                break
            case "valuer":
                this.#_sliderR.value = Number(newVal)
                slide = true
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
    
        if(slide) {
            this.#slideL();
            this.#slideR();
        }
	}

    connectedCallback() {
        this.#slideL();
        this.#slideR();
	}

    get valuel() { return this.#_sliderL.value }
    get valuer() { return this.#_sliderR.value }

    #slideL(){
        if(parseInt(this.#_sliderR.value) - parseInt(this.#_sliderL.value) <= this.#_minGap){
            this.#_sliderL.value = parseInt(this.#_sliderR.value) - this.#_minGap;
        }
        this.#colorizeTrack();
        this.#placeThumbTop(this.#_sliderL, this.#_thumbTopL)
    }

    #slideR(){
        if(parseInt(this.#_sliderR.value) - parseInt(this.#_sliderL.value) <= this.#_minGap){
            this.#_sliderR.value = parseInt(this.#_sliderL.value) + this.#_minGap;
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

    #fire() {
        this.dispatchEvent(
            new CustomEvent("change", { 
                composed: true,
                detail:{
                    left:this.#_sliderL.value,
                    right:this.#_sliderR.value
                } 
            })
          );
    }
}

window.customElements.define('range-slider', Element)
