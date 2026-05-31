/* ============================================================
   banks.js — curated, grade-leveled content banks
   Editable: add/remove entries freely. Loaded before generator.js
   ============================================================ */
window.BANKS = (function(){

/* ---------- Synonyms (word -> list of synonyms) ---------- */
const SYNONYMS = {
  2:[['big',['large','huge','giant']],['happy',['glad','joyful','merry']],['fast',['quick','speedy','swift']],
     ['small',['little','tiny','mini']],['cold',['chilly','icy','cool']],['nice',['kind','sweet','pleasant']],
     ['scared',['afraid','frightened','fearful']],['pretty',['lovely','beautiful','cute']]],
  3:[['begin',['start','commence']],['shout',['yell','holler']],['smart',['clever','bright','intelligent']],
     ['tired',['sleepy','weary','exhausted']],['angry',['mad','furious','upset']],['quiet',['silent','calm','still']],
     ['jump',['leap','hop','bound']],['gather',['collect','assemble']]],
  4:[['enormous',['gigantic','immense','massive']],['difficult',['hard','challenging','tough']],
     ['delicious',['tasty','yummy','flavorful']],['brave',['courageous','bold','fearless']],
     ['ancient',['old','antique','aged']],['rapid',['fast','quick','speedy']],['fragile',['delicate','breakable']],
     ['curious',['inquisitive','interested']]],
  5:[['abundant',['plentiful','ample','copious']],['reluctant',['unwilling','hesitant']],
     ['vivid',['bright','vibrant','intense']],['demonstrate',['show','prove','illustrate']],
     ['essential',['necessary','vital','crucial']],['peculiar',['strange','odd','unusual']],
     ['generous',['giving','charitable','unselfish']],['persuade',['convince','urge']]],
};
/* ---------- Antonyms ---------- */
const ANTONYMS = {
  2:[['hot','cold'],['up','down'],['big','small'],['fast','slow'],['happy','sad'],['day','night'],
     ['open','closed'],['full','empty'],['light','dark'],['wet','dry']],
  3:[['begin','end'],['empty','full'],['loud','quiet'],['brave','afraid'],['accept','reject'],
     ['ancient','modern'],['arrive','depart'],['gather','scatter']],
  4:[['expand','shrink'],['ascend','descend'],['generous','selfish'],['victory','defeat'],
     ['ancient','modern'],['temporary','permanent'],['flexible','rigid'],['praise','criticize']],
  5:[['abundant','scarce'],['humble','arrogant'],['transparent','opaque'],['optimistic','pessimistic'],
     ['expand','contract'],['unite','divide'],['conceal','reveal'],['voluntary','mandatory']],
};
/* ---------- Prefixes & Suffixes ---------- */
const PREFIXES = [
  ['un-','not / opposite','unhappy'],['re-','again','redo'],['pre-','before','preview'],
  ['dis-','not / opposite','disagree'],['mis-','wrongly','misspell'],['over-','too much','overcook'],
  ['under-','too little / below','underground'],['non-','not','nonstop'],['sub-','under','submarine'],
  ['tri-','three','triangle'],['bi-','two','bicycle'],['multi-','many','multicolor'],
];
const SUFFIXES = [
  ['-ful','full of','joyful'],['-less','without','fearless'],['-able','able to be','readable'],
  ['-er','one who / more','teacher'],['-est','most','tallest'],['-ly','in a way','quickly'],
  ['-ness','state of','kindness'],['-ment','action / result','movement'],['-tion','act of','action'],
  ['-y','having','rainy'],['-ous','full of','famous'],['-able','can be done','washable'],
];
/* ---------- Parts of speech (word -> pos) ---------- */
const POS = {
  noun:['dog','school','river','teacher','mountain','happiness','garden','elephant','bicycle','ocean','cousin','library'],
  verb:['run','jump','write','sing','imagine','discover','explore','whisper','build','swim','climb','create'],
  adjective:['bright','tiny','curious','gentle','ancient','slippery','brave','colorful','frozen','enormous','silent','cheerful'],
  adverb:['quickly','slowly','carefully','loudly','gently','rarely','everywhere','soon','happily','quietly','suddenly','daily'],
};
/* ---------- Plurals (singular -> plural) ---------- */
const PLURALS = [
  ['cat','cats'],['dog','dogs'],['box','boxes'],['bus','buses'],['baby','babies'],['city','cities'],
  ['leaf','leaves'],['knife','knives'],['child','children'],['mouse','mice'],['foot','feet'],['tooth','teeth'],
  ['wish','wishes'],['fox','foxes'],['party','parties'],['half','halves'],['man','men'],['woman','women'],
  ['goose','geese'],['person','people'],['penny','pennies'],['glass','glasses'],['story','stories'],['wolf','wolves'],
];
/* ---------- Contractions (phrase <-> contraction) ---------- */
const CONTRACTIONS = [
  ['do not',"don't"],['can not',"can't"],['I am',"I'm"],['it is',"it's"],['we are',"we're"],
  ['they are',"they're"],['is not',"isn't"],['was not',"wasn't"],['will not',"won't"],['should not',"shouldn't"],
  ['you are',"you're"],['he is',"he's"],['she is',"she's"],['did not',"didn't"],['could not',"couldn't"],
  ['would not',"wouldn't"],['have not',"haven't"],['that is',"that's"],['let us',"let's"],['I will',"I'll"],
];
/* ---------- Sentence types ---------- */
const SENTENCES = [
  ['The sun is shining brightly today.','declarative'],
  ['Where did you put my backpack?','interrogative'],
  ['Watch out for that puddle!','exclamatory'],
  ['Please close the door quietly.','imperative'],
  ['My favorite season is autumn.','declarative'],
  ['How many planets are in our solar system?','interrogative'],
  ['What an amazing magic trick that was!','exclamatory'],
  ['Finish your homework before dinner.','imperative'],
  ['The library opens at nine in the morning.','declarative'],
  ['Did you feed the goldfish yet?','interrogative'],
  ['I can not believe we won the game!','exclamatory'],
  ['Take out the recycling tonight.','imperative'],
];
/* ---------- Spelling word lists by grade ---------- */
const SPELLING = {
  2:['because','friend','school','please','little','happy','water','because','about','there',
     'their','where','which','would','people','animal','family','pretty','color','jumped'],
  3:['through','believe','different','enough','beautiful','favorite','important','probably','remember','special',
     'between','knowledge','neighbor','science','straight','thought','weather','answer','calendar','height'],
  4:['necessary','separate','definitely','interrupt','rhythm','sincerely','possession','tomorrow','vacuum','library',
     'February','government','restaurant','vegetable','Wednesday','beginning','character','difference','experience','familiar'],
  5:['accommodate','conscience','embarrass','exaggerate','mischievous','perseverance','privilege','recommend','twelfth','vacuum',
     'acquaintance','bureaucracy','camouflage','dilemma','fluorescent','guarantee','liaison','millennium','occurrence','questionnaire'],
};
/* ---------- Vocabulary (word -> definition) for matching ---------- */
const VOCAB = {
  2:[['brave','not afraid'],['gather','to bring together'],['enormous','very big'],['whisper','to speak very softly'],
     ['journey','a long trip'],['fragile','easily broken'],['glad','happy'],['rapid','very fast']],
  3:[['ancient','very old'],['curious','wanting to know'],['demonstrate','to show how'],['fierce','very strong or violent'],
     ['observe','to watch carefully'],['portion','a part of something'],['reluctant','unwilling'],['vacant','empty']],
  4:[['abundant','more than enough'],['analyze','to study closely'],['cautious','being careful'],['estimate','to make a good guess'],
     ['hesitate','to pause before acting'],['precise','exact'],['summarize','to tell the main points'],['vivid','very bright and clear']],
  5:[['advocate','to support a cause'],['coincide','to happen at the same time'],['deliberate','done on purpose'],
     ['inevitable','certain to happen'],['notorious','famous for something bad'],['plausible','believable'],
     ['scrutinize','to examine closely'],['tedious','long and boring']],
};

/* ---------- Reading comprehension passages ---------- */
/* each: {grade, title, text, questions:[{q, a}]} */
const PASSAGES = [
  { grade:1, title:'My Dog Spot',
    text:`I have a dog. His name is Spot. Spot is brown and white. He likes to run and play. We play ball in the yard. Spot is my best friend.`,
    questions:[
      {q:'What is the dog’s name?',a:'Spot.'},
      {q:'What colors is Spot?',a:'Brown and white.'},
      {q:'What do they play in the yard?',a:'Ball.'},
    ]},
  { grade:1, title:'The Red Hat',
    text:`Sam has a red hat. The hat is big and warm. Sam wears the hat in the snow. The wind blows, but Sam is not cold. The red hat keeps Sam warm.`,
    questions:[
      {q:'What color is the hat?',a:'Red.'},
      {q:'When does Sam wear the hat?',a:'In the snow.'},
      {q:'How does the hat make Sam feel?',a:'Warm (not cold).'},
    ]},
  { grade:1, title:'A Day at the Pond',
    text:`Ducks swim in the pond. A frog sits on a log. The sun is warm and bright. A fish jumps up high. The pond is full of life.`,
    questions:[
      {q:'What swims in the pond?',a:'Ducks.'},
      {q:'Where does the frog sit?',a:'On a log.'},
      {q:'What does the fish do?',a:'It jumps up high.'},
    ]},
  { grade:2, title:'Lily Learns to Ride',
    text:`Lily wanted to ride her new bike. At first she was scared and wobbled a lot. Her dad held the seat and ran beside her. After three tries, Lily rode all by herself. She felt so proud as she pedaled down the path.`,
    questions:[
      {q:'What did Lily want to do?',a:'Ride her new bike.'},
      {q:'How did Lily feel at first?',a:'Scared.'},
      {q:'Who helped Lily?',a:'Her dad.'},
      {q:'How did Lily feel at the end?',a:'Proud.'},
    ]},
  { grade:2, title:'The Busy Ants',
    text:`Ants are very small, but they work hard together. They march in a long line to find food. Each ant carries a tiny crumb back to the nest. The ants store the food so the whole colony can eat. By working as a team, the ants get a big job done.`,
    questions:[
      {q:'How do ants find food?',a:'They march in a line.'},
      {q:'What does each ant carry?',a:'A tiny crumb.'},
      {q:'Why do the ants store food?',a:'So the whole colony can eat.'},
      {q:'How do the ants get a big job done?',a:'By working together as a team.'},
    ]},
  { grade:3, title:'The Curious Crow',
    text:`A clever crow was very thirsty. She found a tall pitcher with a little water at the bottom, but her beak could not reach it. The crow did not give up. She picked up small pebbles one at a time and dropped them into the pitcher. As the pebbles filled the bottom, the water slowly rose higher and higher. Soon the water reached the top, and the happy crow drank until she was no longer thirsty.`,
    questions:[
      {q:'What was the crow’s problem?',a:'She was thirsty and could not reach the water.'},
      {q:'How did the crow solve her problem?',a:'She dropped pebbles in to raise the water.'},
      {q:'What word best describes the crow?',a:'Clever / smart (accept similar).'},
      {q:'Why did the water rise?',a:'The pebbles took up space at the bottom.'},
    ]},
  { grade:3, title:'Maya’s Garden',
    text:`Maya planted tomato seeds in the spring. Every morning she watered them and pulled out the weeds. At first nothing happened, and Maya felt worried. Then tiny green sprouts pushed up through the soil. By summer, bright red tomatoes hung from the tall plants. Maya shared the tomatoes with her neighbors, and everyone said they were the best they had ever tasted.`,
    questions:[
      {q:'What did Maya plant?',a:'Tomato seeds.'},
      {q:'What two things did Maya do every morning?',a:'Watered the plants and pulled weeds.'},
      {q:'How did Maya feel at first?',a:'Worried.'},
      {q:'What did Maya do with the tomatoes?',a:'She shared them with her neighbors.'},
    ]},
  { grade:4, title:'The Hidden Tide Pools',
    text:`When the ocean tide goes out, it leaves behind small pools of water trapped among the rocks. These tide pools are tiny worlds full of life. Crabs scuttle sideways across the sand, while starfish cling tightly to the stones. Sea anemones wave their soft arms to catch food floating by. Scientists study tide pools because they show how animals survive in a place that changes twice every day. When the tide returns, the pools disappear beneath the waves until the next low tide.`,
    questions:[
      {q:'What creates a tide pool?',a:'The tide going out leaves water trapped in rocks.'},
      {q:'Name two animals mentioned in the passage.',a:'Any two: crabs, starfish, sea anemones.'},
      {q:'Why do scientists study tide pools?',a:'To see how animals survive a place that changes twice a day.'},
      {q:'What happens when the tide returns?',a:'The pools disappear beneath the waves.'},
      {q:'What does “cling tightly” tell you about starfish?',a:'They hold on firmly so they are not washed away.'},
    ]},
  { grade:4, title:'A Surprise at Camp',
    text:`Diego had never been camping before, and he was nervous about sleeping outdoors. The first night, strange sounds filled the dark forest. He pulled his sleeping bag over his head and barely slept. But in the morning, sunlight streamed through the trees, birds sang cheerfully, and the air smelled fresh and sweet. Diego realized the noises had only been crickets and an owl. By the second night, he lay awake on purpose, listening to the peaceful music of the forest.`,
    questions:[
      {q:'Why was Diego nervous?',a:'He had never been camping and feared sleeping outdoors.'},
      {q:'What had the scary noises actually been?',a:'Crickets and an owl.'},
      {q:'How did Diego’s feelings change from the first night to the second?',a:'He went from afraid to calm and happy.'},
      {q:'What is the main lesson of the story?',a:'Things we fear are often not as scary as they seem.'},
    ]},
  { grade:5, title:'The Inventor of Braille',
    text:`Louis Braille lost his sight in an accident when he was only three years old. As a student at a school for the blind in France, he found the available reading methods clumsy and slow. Determined to help blind people read more easily, Louis spent years developing a system of raised dots that fingers could feel. By the time he was fifteen, he had created a code using just six dots arranged in different patterns. Each pattern stands for a letter, number, or symbol. Today, the Braille system is used around the world, allowing millions of people who are blind to read and write independently.`,
    questions:[
      {q:'How did Louis Braille lose his sight?',a:'In an accident when he was three years old.'},
      {q:'Why was Louis unhappy with existing reading methods?',a:'They were clumsy and slow.'},
      {q:'Describe the system Louis created.',a:'A code of six raised dots in different patterns for letters, numbers, and symbols.'},
      {q:'How old was he when he finished it?',a:'Fifteen.'},
      {q:'Why is Braille still important today?',a:'It lets blind people read and write independently worldwide.'},
    ]},
  { grade:5, title:'Why Leaves Change Color',
    text:`Throughout spring and summer, leaves look green because they are full of a substance called chlorophyll, which plants use to turn sunlight into food. Chlorophyll is so plentiful that it hides the other colors inside the leaf. As autumn arrives, the days grow shorter and cooler, and trees stop making chlorophyll. Once the green fades, the yellow and orange colors that were there all along become visible. Some trees also produce red pigments in the fall. Eventually the leaves dry out, die, and drift to the ground, and the tree rests until spring.`,
    questions:[
      {q:'What makes leaves green?',a:'Chlorophyll.'},
      {q:'What is chlorophyll used for?',a:'Turning sunlight into food for the plant.'},
      {q:'Why do leaves change color in autumn?',a:'Trees stop making chlorophyll, so other colors show.'},
      {q:'Were the yellow and orange colors new in fall? Explain.',a:'No—they were there all along, hidden by green.'},
      {q:'What happens to the tree after the leaves fall?',a:'It rests until spring.'},
    ]},
];

return { SYNONYMS, ANTONYMS, PREFIXES, SUFFIXES, POS, PLURALS, CONTRACTIONS,
         SENTENCES, SPELLING, VOCAB, PASSAGES };
})();
