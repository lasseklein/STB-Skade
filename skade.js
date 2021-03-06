//Uses Handlebars
//Uses https://bernii.github.io/gauge.js/

var opts = {
  angle: -0.2, // The span of the gauge arc
  animationSpeed: 11  ,
  fontSize: 41,
  lineWidth: 0.23, // The line thickness
  radiusScale: 0.6, // Relative radius
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
gauge.maxValue = 100; // set max gauge value
gauge.setMinValue(0);  // Prefer setter over gauge.minValue = 0
gauge.setTextField( document.getElementById( 'gaugescore' ));
gauge.set(0); // set actual value

var t = `
<div class='house'>
  <div class="margin-bottom margin-small">
    <div class='roomicon'>house</div>
    <div class="heading-xsmall">Hele huset</div>
  </div>
  <div class='measures'>
    {{#measures}}
      <div class='measurecontainer'>
        <div class='measure{{#selected}} selected{{/selected}}'
          data-measure='{{@index}}'>
          {{name}}
        </div>
      </div>
    {{/measures}}
  </div>
</div>

<div class='rooms'>
  {{#rooms}}
    <div class='room' data-room='{{@index}}'>
    <div class='roomicon'>{{icon}}</div>
    <div class='roomname'>{{name}}</div>
    <div class='removeroom' data-room='{{@index}}'>&#x2715;</div>
      <div class='measures'>
        {{#measures}}
          <div class='measurecontainer'>
            <div class='measure{{#selected}} selected{{/selected}}' 
              data-room='{{@../index}}'
              data-measure='{{@index}}' 
              href='#'>
              {{name}}
            </div>
          </div>
          {{/measures}}
      </div>
    </div>
  {{/rooms}}
</div>
`;

var template = Handlebars.compile(t);

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
	constructor (name, icon, measures) {
  	this.name = name;
    this.icon = icon;
     for(const measure of measures) {
       this.measures.push(measure.clone());
    }
   }
  measures = [];
  clone() {
    return new Room(this.name, this.icon, this.measures);
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
  gauge.set(score);
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
  var alarm             = new Measure('Innbruddsalarm', 50, 'Om alarm');
  var alarmvarsling     = new Measure('Innbruddsvarsling til alarmselskap', 50, 'Om varsling');
  var brannvarsling     = new Measure('Brannvarsling til alarmselskap', 50, 'Om brannvarsling');
  var automatsikringer  = new Measure('Automatsikringer', 75, '');
  var jordfeilbryter    = new Measure('Jordfeilbrytere', 75, '');
  var ror               = new Measure('R??r-i-r??r', 50, '');
  var lekkasjesensor    = new Measure('Lekkasjesensor', 25, '');
  var brannvarsler      = new Measure('R??ykvarsler', 20, '');
  var fuktsensor        = new Measure('Fuktsensor', 60, '');
  
  rooms = {
    'Stue'    : new Room('Stue',    'chair', [brannvarsler]),
    'Kj??kken' : new Room('Kj??kken', 'kitchen', [brannvarsler, lekkasjesensor]),
    'Bad'     : new Room('Bad',     'bathtub', [brannvarsler, lekkasjesensor]),
    'Soverom' : new Room('Soverom', 'bed', [brannvarsler]),
    'Kjeller' : new Room('Kjeller', 'stairs', [brannvarsler, fuktsensor])
  }

  const savedhouse = localStorage.getItem('ssx_house');
  if ( 0 ) {
    // need to recreate referenced classes too here...
    oldhouse = JSON.parse( savedhouse );
    console.log('oh: '+oldhouse);
    house = new House(oldhouse.rooms, oldhouse.measures);
    //Object.assign(new House, savedhouse)
  } else {
    house = new House(Object.values(rooms), [vannstopper,lekkasjesensor,jordfeilbryter,automatsikringer,ror,alarm,alarmvarsling,brannvarsling]);
  }

  redrawHouse();
  
  var roombuttons="";
  for(var room in rooms) {
    roombuttons+="<div class='addroombutton' data-roomname='"+rooms[room].name+"'>"+rooms[room].name+"</div>";
  }
  $('#roomlist').append(roombuttons);
  $('.addroombutton').click(addRoom);

});

