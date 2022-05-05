//Uses Handlebars
//Uses https://bernii.github.io/gauge.js/

var opts = {
  angle: -0.2, // The span of the gauge arc
  animationSpeed: 11,
  lineWidth: 0.23, // The line thickness
  radiusScale: 1, // Relative radius
  pointer: {
    length: 0.6, // // Relative to gauge radius
    strokeWidth: 0.035, // The thickness
    color: '#000000' // Fill color
  },
  limitMax: 0,     // If false, max value increases automatically if value > maxValue
  limitMin: 100,     // If true, the min value of the gauge will be fixed
  colorStart: '#6FADCF',   // Colors
  colorStop: '#8FC0DA',    // just experiment with them
  strokeColor: '#E0E0E0',  // to see which ones work best for you
  generateGradient: true,
  highDpiSupport: true,     // High resolution support
  percentColors : [[0.0, "#a9d70b" ], [0.50, "#f9c802"], [1.0, "#ff0000"]],
  staticZones: [
    {strokeStyle: "#F03E3E", min: 0, max: 30},
    {strokeStyle: "#FFDD00", min: 30, max: 65},
    {strokeStyle: "#30B32D", min: 65, max: 100}
 ],

};
var target = document.getElementById('gaugecanvas'); // your canvas element
var gauge = new Gauge(target).setOptions(opts); // create sexy gauge!
gauge.maxValue = 3000; // set max gauge value
gauge.setMinValue(0);  // Prefer setter over gauge.minValue = 0
gauge.animationSpeed = 32; // set animation speed (32 is default value)
gauge.set(1244); // set actual value

var t = `
<div class='housemeasures'>
{{#measures}}
  <div class='measure{{#selected}} selected{{/selected}}' data-measure='{{@index}}'>{{name}}</div>
{{/measures}}
</div>

<div class='rooms'>
{{#rooms}}
  <div class='roomrow'>
    <div class='room' data-room='{{@index}}'>
      <div class='roomname'>{{name}}</div>
        <div class='sf-measures'>
        {{#measures}}
          <div class='measure{{#selected}} selected{{/selected}}' 
            data-room='{{@../index}}'
            data-measure='{{@index}}' 
            href='#'
          >
            {{name}}
          </div>
        {{/measures}}
        </div>
        <div class='removeroom' data-room='{{@index}}'>&#x2715;</div>
      </div>
  </div>
{{/rooms}}
</div>
`;

var template = Handlebars.compile(t);

var scoreneedle = $("#needle");

class Measure {
	constructor (name, value, description) {
  	this.name = name;
    this.value = value;
    this.description = description;
  }
  selected = false;
  clone() {
    return new Measure(this.name, this.value, this.description);
  }
  toggle() {
    this.selected = !this.selected;
  }
}

class Room {
	constructor (name, measures) {
  	this.name = name;
     for(const measure of measures) {
       this.measures.push(measure.clone());
    }
   }
  measures = [];
  clone() {
    return new Room(this.name, this.measures);
  }
}


class House {
	constructor (rooms, measures) {
    if (rooms) {
    	this.rooms = rooms;
    } 
    if (measures) {
      for(const measure of measures) {
        this.measures.push(measure.clone());
      }
    }
    this.update();
  }
  rooms = [];
  measures = [];
  score = 0;
  maxscore = 0;
  scorepct = 0;
  addRoom(room) {
    this.rooms.push(room);
    this.update();
    redrawHouse();
  }
  removeRoom(roomnum){
    if(this.rooms.length > roomnum){
      this.rooms.splice(roomnum, 1);
      this.update();
      redrawHouse();
    }
  }
  getMeasure(room, measure){
    if(room) {
      return this.rooms[room].measures[measure];
    } else {
      return this.measures[measure];
    }
  }
  update() {
    var allmeasures = [];
    allmeasures = allmeasures.concat(this.measures);
    for(const room of this.rooms){
     allmeasures = allmeasures.concat(room.measures);
    }
    this.score = 0;
    this.maxscore = 0;
    for(const m of allmeasures){
      if(m.selected) this.score += m.value;
      this.maxscore += m.value;
    }

    this.scorepct = Math.round(100*this.score/this.maxscore);
    console.log('Score: '+this.score + ' of '+ this.maxscore + ' = '
                + this.scorepct +'%');
    updateScore(this.scorepct);
    this.serialize();
  }
  serialize() {
    localStorage.setItem('ssx_house', JSON.stringify(this));
  }

}

function updateScore(score) {
  var degrees = -70.0 + (score*1.4);
  scoreneedle.css({'transform' : 'rotate('+  degrees +'deg)'});
  oldscore = parseInt($('#scorevalue').html()); 
  scorecounter(oldscore,oldscore,score,$('#scorevalue') )
}

function toggleMeasure(e) {
  const r = e.target.getAttribute("data-room");
  const m = e.target.getAttribute("data-measure");
  const measure = house.getMeasure(r, m);
  console.log(measure);
  measure.toggle();
  if(measure.selected){
    $(this).addClass('selected');
  } else {
    $(this).removeClass('selected');
  }
  house.update();

}
function addRoom(e){
  const roomname = e.target.getAttribute("data-roomname");
  house.addRoom( rooms[roomname].clone() );
}

function removeRoom(e) {
  const r = e.target.getAttribute("data-room");
  house.removeRoom(r);

}

function redrawHouse(){
  house.update();
  const househtml = template(house);
  $('#house').html(househtml);
  $('.measure').click (toggleMeasure);
  $('.removeroom').click (removeRoom);
}

var house;
var rooms;

$( document ).ready(function() {

  var vannstopper       = new Measure('Vannstopper', 100, 'Stopper vannet');
  var alarm             = new Measure('Alarm', 50, 'Om alarm');
  var automatsikringer  = new Measure('Automatsikringer', 75, '');
  var ror               = new Measure('Rør-i-rør', 50, '');
  var lekkasjesensor    = new Measure('Lekkasjesensor', 25, '');
  var brannvarsler      = new Measure('Røykvarsler', 20, '');
  var fuktsensor        = new Measure('Fuktsensor', 60, '');
  
  rooms = {
    'Stue'    : new Room('Stue',    [brannvarsler]),
    'Kjøkken' : new Room('Kjøkken', [brannvarsler, lekkasjesensor]),
    'Bad'     : new Room('Bad',     [brannvarsler, lekkasjesensor]),
    'Soverom' : new Room('Soverom', [brannvarsler, lekkasjesensor]),
    'Kjeller' : new Room('Kjeller', [brannvarsler, fuktsensor])
  }

  const savedhouse = localStorage.getItem('ssx_house');
  if ( 0 ) {
    // need to recreate referenced classes too here...
    oldhouse = JSON.parse( savedhouse );
    console.log('oh: '+oldhouse);
    house = new House(oldhouse.rooms, oldhouse.measures);
    //Object.assign(new House, savedhouse)
  } else {
    house = new House(Object.values(rooms), [vannstopper,alarm,automatsikringer,ror]);
  }

  redrawHouse();
  
  var roombuttons="";
  for(var room in rooms) {
    roombuttons+="<div class='addroombutton' data-roomname='"+rooms[room].name+"'>"+rooms[room].name+"</div>";
  }
  $('#roomlist').append(roombuttons);
  $('.addroombutton').click(addRoom);

});



function scorecounter(start,current,target,element) {
  const duration = 250;
  var dir = (target>start)?1:-1;
  var diff = dir*(target-start);
  var speed = duration/diff;

  var step = dir*Math.trunc((target-start) / speed);
  step = (step<1)?1:step;
  current += dir*step;
  if (dir*(target-current)>0) {
    element.html(current);
    setTimeout(scorecounter, speed, start,current,target,element);
  } else {
    element.html(target);
  }
}