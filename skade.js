//Uses Handlebars

var t = `
<div class='housemeasures'>
{{#measures}}
  <div class='measure{{#selected}} selected{{/selected}}' data-measure='{{@index}}'>{{name}}</div>
{{/measures}}
</div>

<div class='rooms'>
{{#rooms}}
  <div class='room' data-room='{{@index}}'>
    <div class='roomname'>{{name}}</div>
    {{#measures}}
      <div class='measure{{#selected}} selected{{/selected}}' data-room='{{@../index}}' data-measure='{{@index}}' href='#'>
        {{name}}
      </div>
    {{/measures}}
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
}


class House {
	constructor (rooms, measures) {
  	this.rooms = rooms; 
    for(const measure of measures) {
      this.measures.push(measure.clone());
    }
  }
  rooms = [];
  measures = [];
  score = 0;
  maxscore = 0;
  scorepct = 0;
  removeRoom(roomnum){
    if(this.rooms.length > roomnum){
      this.rooms.splice(roomnum, 1);
      this.update;
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
    localStorage.setItem('house', JSON.stringify(this));
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

function removeRoom(roomnum) {
  house.removeRoom(roomnum);
  const househtml = template(house);
  $('#house').html(househtml);
  $('.measure').click (toggleMeasure);
}

var house;

$( document ).ready(function() {

  var vannstopper       = new Measure('Vannstopper', 100, 'Stopper vannet');
  var alarm             = new Measure('Alarm', 50, 'Om alarm');
  var automatsikringer  = new Measure('Automatsikringer', 75, '');
  var ror               = new Measure('Rør-i-rør', 50, '');
  var lekkasjesensor    = new Measure('Lekkasjesensor', 25, '');
  var brannvarsler      = new Measure('Røykvarsler', 20, '');
  var fuktsensor        = new Measure('Fuktsensor', 60, '');
  
  var rooms = {
    livingroom : new Room('Stue',    [brannvarsler]),
    kitchen    : new Room('Kjøkken', [brannvarsler, lekkasjesensor]),
    bathroom   : new Room('Bad',     [brannvarsler, lekkasjesensor]),
    bedroom    : new Room('Soverom', [brannvarsler, lekkasjesensor]),
    cellar     : new Room('Kjeller', [brannvarsler, fuktsensor])
  }

  house = new House(Object.values(rooms), [vannstopper,alarm,automatsikringer,ror]);
  house.update();

  const househtml = template(house);
  $('#house').append(househtml);

  $('.measure').click (toggleMeasure);

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