
var GLOBAL = null;
var DOMAIN = 'https://steemit.com/';  
var ACCOUNTS = [
    {name: 'reliquary'},
    {name: 'sniffnscurry'},
    {name: 'sc-v'},    
    {name: 'sc-n'},
    {name: 'steemchurch'},
    {name: 'sc-g'},
    {name: 'sirknight'},
    {name: 'farms'},
    {name: 'emiliocabrera'},
    {name: 'darlenys01'}    
];
var PROPS = {};
var PICTURES = {
    angel: './multimedia/angel.png',
    dove_up: './multimedia/dove-up.png',
    dove_down: './multimedia/dove-down.png',
    star: './multimedia/star.png'
};
var LEGAL_OPERATIONS = ['vote', 'comment', 'transfer']; // list of operations eligible for processing 

var debug = 1;
//steem.api.setOptions({ url: 'https://api.steemit.com' });

$(function () {
    
    run();
         
    // init tooltip
    $('body').on('mouseover', '.figure', function(){               
        
         var h_space = $(this).offset().top*1 + $(this).height()*1 + $(this).find('.tooltip').height()*1 + 13;

         if(h_space > $(window).height()*1){            
             var delta = $(this).height() - (h_space - $(window).height());
             $(this).find('.tooltip').css('top', delta+'px');
         } else {
             $(this).find('.tooltip').css('top', '');
         }

         $(this).find('.tooltip').show();  
    });
    $('body').on('mouseover', '.cl-steemchurch', function(){ 
        let tooltip = $(this).find('.tooltip');
        tooltip.css('top','');
        tooltip.css('left',(($(window).width()*1-tooltip.width()*1)/2)+'px');
        tooltip.show();  
    });
    // hide tooltip
    $('body').on('mouseout', '.figure, .cl-steemchurch', function(){
         $(this).find('.tooltip').hide(); 
    });
    // switch on/off sound and toggle icon
    $('.sound-box').on('click', function(){
        if($('.sound-box').hasClass('switch')){
            document.getElementById('player').pause();
        }  else {
            document.getElementById('player').play();
        }
        $('.sound-box').toggleClass('switch');
    });
    
});

async function run(){   
    displayAccounts();
    //GLOBAL = await steem.api.getDynamicGlobalPropertiesAsync();
    showAccountsHistory();
    fillDelegatorsPopup();
    steem.api.streamOperations(function (err, operations) {
        if (err === null) {
            let operation = '';
            operations.forEach(function (item, i, data) {
               operation = (i === 0) ? item : operation;
               if((i === 1) && (LEGAL_OPERATIONS.indexOf(operation) !== -1)){                   
                   processOperation(operation, item);                 
               }   
            });
        }  else {
            console.log('Error! Cant get stream:', err);
        }
    });
    
}

// fill popup of delegators for steemchurch
async function fillDelegatorsPopup(){
    let delegators = await getDelegators();
    delegators.sort(function(a,b){if(a.value*1 > b.value*1) return -1; if(a.value*1 < b.value*1) return 1; return 0;});
    var tooltip = '<table>';
    tooltip += '<tr><td colspan="8" class="hd">Delegators</td></tr>';
    let cnt = 0;
    for(let item of delegators){        
         if(++cnt == 1) tooltip += '<tr>';
         tooltip += '<td class="bright">'+item.name+'</td><td><div>'+item.value+' SP</div></td>';
         if(cnt % 4 == 0) tooltip += '</tr><tr>';
    }
    tooltip += '</table>';
    $('.cl-steemchurch .tooltip').html(tooltip);
    return tooltip;          
}

// calls respective animation dependly of an operation
function processOperation(operation, item, bw){
   let accounts_names = ACCOUNTS.map(function(data){return data.name;}); 
   switch(operation){ 
        case 'vote': 
           tx = {Upvoter: '<a href="'+DOMAIN+'@'+item.voter+'" class="author-link" target="_blank">'+item.voter+'</a>', Author: '<a href="'+DOMAIN+'@'+item.author+'" class="author-link" target="_blank">'+item.author+'</a>', Weight: (item.weight/100).toFixed(1)+'%', Link: '<a href="'+DOMAIN+'@'+item.author+'/'+item.permlink+'" class="permlink" target="_blank">'+item.permlink.substring(0,15)+'</a>'};
           // a main account upvotes for someone - падающий ангел
           if(accounts_names.indexOf(item.voter) !== -1){
               createAnimation(PICTURES.angel, item.voter, item.author, 'down', 'Upvote', tx, bw);
               if(debug) console.log(item.voter+' upvotes to '+item.author);
           } 
           // someone upvotes a main account - взлетающий ангел
           else if(accounts_names.indexOf(item.author) !== -1){
                createAnimation(PICTURES.angel, item.author, item.voter, 'up', 'Upvote', tx, bw);
                if(debug) console.log(item.author+' receive upvote from '+item.voter);
           }
           break;
        case 'transfer':
           
            tx = {From: '<a href="'+DOMAIN+'@'+item.from+'" class="author-link" target="_blank">'+item.from+'</a>', To: '<a href="'+DOMAIN+'@'+item.to+'" class="author-link" target="_blank">'+item.to+'</a>', Amount: item.amount, Memo: item.memo};
            // a main account transfer to someone - падающая звезда
           if(accounts_names.indexOf(item.from) !== -1){                          
               createAnimation(PICTURES.star, item.from, item.to, 'down', 'Transfer', tx, bw);
               if(debug) console.log(item.from+' transfer to '+item.to);
           } 
           // someone transfer to a main account - взлетающая звезда
           else if(accounts_names.indexOf(item.to) !== -1){
                createAnimation(PICTURES.star, item.to, item.from, 'up', 'Transfer', tx, bw);
                if(debug) console.log(item.to+' received transfer from'+item.from);
           }   
           break;
        case 'comment':                            
            // a main account posted or commented - опускающийся голубь
           if(accounts_names.indexOf(item.author) !== -1){   
               title = item.parent_author == '' ? 'Post' : 'Comment';
               tx = {Author: '<a href="'+DOMAIN+'@'+item.author+'" class="author-link" target="_blank">'+item.author+'</a>', Link: '<a href="'+DOMAIN+'@'+item.author+'/'+item.permlink+'" class="permlink" target="_blank">'+title+'</a>'};
               createAnimation(PICTURES.dove_down, item.author, '','down', title, tx);
               if(debug) console.log(item.author+' posted or commented ');
           } 
           // someone commented a post of a main account - взлетающий голубь
           else if(accounts_names.indexOf(item.parent_author) !== -1){
                tx = {Author: '<a href="'+DOMAIN+'@'+item.author+'" class="author-link" target="_blank">'+item.author+'</a>', Link: '<a href="'+DOMAIN+'@'+item.author+'/'+item.permlink+'" class="permlink" target="_blank">Comment</a>'};
                createAnimation(PICTURES.dove_up, item.parent_author, item.author, 'up','Comment', tx);
                if(debug) console.log(item.parent_author+' commented by '+item.author);
           }   
           break;
   }  
}
// get delegators for steemchurch account
async function getDelegators(){
    let history = await steem.api.getAccountHistoryAsync('steemchurch', -1, 10000);  
    let delegators = [];
    if($.isArray(history) && history.length > 0){
        for(let item of history){
            if(item[1].op[0]=='delegate_vesting_shares'){
                //console.log(item);
                if(item[1].op[1].delegatee == 'steemchurch'){
                    let v_shares = item[1].op[1].vesting_shares;
                    let sp = await GestsToSteem(v_shares.split(' ')[0]);
                    // delete delegator duplicates
                    delegators = delegators.filter(function(data){return data.name !== item[1].op[1].delegator});
                    if(sp > 0){
                        delegators.push({name:item[1].op[1].delegator, value:sp});
                    }
                }
            }
        }
    }
    console.log(delegators.length);
    return delegators;
}

// convert GESTS (VESTS) to STEEM
async function GestsToSteem(gests){
    await retrieveDynGlobProps();
    //tools.log(props);
    let steem_per_mvests = 1000000.0 * parseFloat(PROPS.total_vesting_fund_steem) / parseFloat(PROPS.total_vesting_shares);
    return (parseFloat(gests) / 1000000 * steem_per_mvests).toFixed(3)*1;
}

async function retrieveDynGlobProps() {   
    if(Object.keys(PROPS).length == 0){
        PROPS = await steem.api.getDynamicGlobalPropertiesAsync();  
        let reward_fund = await steem.api.getRewardFundAsync("post");
        let median_history = await steem.api.getCurrentMedianHistoryPriceAsync();
        PROPS.reward_balance = parseFloat(reward_fund.reward_balance.replace(" STEEM", ""));
        PROPS.recent_claims = reward_fund.recent_claims;     
        PROPS.steem_price = parseFloat(median_history.base.replace(" SBD", "")) / parseFloat(median_history.quote.replace(" STEEM", ""));
        PROPS.total_vesting_fund_steem = parseFloat(PROPS.total_vesting_fund_steem);
        PROPS.total_vesting_shares = parseFloat(PROPS.total_vesting_shares);          
    }
}

// append animated picture and set direction
function createAnimation(picture, main_account, interact_account, direction, title, msg, bw){
    var LIFE_TIME = getRand(15, 30); // animation life time  
    let id = main_account+'_'+interact_account+'_'+(new Date()).getTime();
    let tooltip_position = main_account === ACCOUNTS[ACCOUNTS.length-1].name ? 'right' : 'left';
    $("<style id='keyframe_"+id+"' type='text/css'>"+initKeyframe(id, main_account, direction)+" </style>").appendTo("head");
   
    let container = '<div class="figure" id="'+id+'" style="animation:fly_'+id+' '+LIFE_TIME+'s 1 '+getAnimationType()+';">';
    bw = bw ? 'style="filter: grayscale(60%);"' : "";
    container += '<img src="'+picture+'" width="40" '+bw+' />';
    container += getTooltip(title, msg, tooltip_position)+'</div>';
    
    $('.main-box').append(container);
    
    $('#'+id).one('webkitAnimationEnd oanimationend msAnimationEnd animationend',   
        function(e) {                   
            $('#'+id).remove();        
            $('#keyframe_'+id).remove();
        }
    );
}

async function displayAccounts(){
       
    for(let acc of ACCOUNTS){    
        let wings = (acc.name == 'sirknight') ? 'black' : 'white';
        let tooltip = acc.name == 'steemchurch' ? '<div class="tooltip"><span class="bright">Loading delegators...</span></div>' : '';
        let church_class = acc.name == 'steemchurch' ? 'church' : '';
        let top = acc.name == 'steemchurch' || acc.name == 'sirknight' ? 'top' : '';
        $('.top-line').append("<div class='cl-"+acc.name+" account-box "+top+"' onclick='window.location=\"https://steemit.com/@"+acc.name+"\"'><img class='wings "+church_class+"' src='./multimedia/wing-left-"+wings+".png'/><div class='ava "+church_class+"' style='background: url(https://steemitimages.com/u/"+acc.name+"/avatar) no-repeat; background-size: cover;'></div><img  class='wings "+church_class+"' src='./multimedia/wing-right-"+wings+".png'/><div class='title'>"+acc.name+"</div>"+tooltip+"</div>");
    }
} 

    
function getAnimationType(){
    var types = ['linear', 'ease-out', 'linear', 'ease-out', 'linear'];
    //return types[getRand(0, 4)];
    return 'linear';
}
    
function initKeyframe(id, account, direction){
    var account_class = 'cl-'+account;
    var position = $('.'+account_class).position(); // position of account box on the top line
    var offset_left = position.left*1 + $('.'+account_class).width()/2;
    var offset_top = position.top*1 + 20;
    //console.log(account, offset_top, position.top, $('.'+account_class).height());
    var rand_offset = offset_left+getRand(-50, 50);
    
    var key_set = (direction === 'up') 
    ? [
        "@keyframes fly_"+id+"{from{left:"+rand_offset+"px; top:100%; opacity:0;} to{left:"+offset_left+"px; top:"+offset_top+"px; opacity:10%; transform:rotate(0deg);} 20%{left:"+(rand_offset-8)+"px; top:80%; opacity:1; transform:rotate(-4deg);} 30%{left:"+(rand_offset)+"px; top:70%; transform:rotate(4deg);} 40%{left:"+(rand_offset+8)+"px; top:60%; transform:rotate(6deg);} 50%{left:"+(rand_offset)+"px; top:50%;} 60%{left:"+(rand_offset-8)+"px; top:40%; transform:rotate(-6deg);} 70%{left:"+(rand_offset-2)+"px; top:30%; transform:rotate(-2deg);} 80%{left:"+(rand_offset+8)+"px; top:20%; transform:rotate(4deg);}}",
        //"@keyframes fly_"+id+"{from{left:"+rand_offset+"px; top:100%; opacity:0;} to{left:"+offset_left+"px; top:"+offset_top+"px; opacity:0; transform:rotate(0deg);} 30%{left:"+(rand_offset-20)+"px; top:70%; transform:rotate(8deg); opacity:1;}  60%{left:"+(rand_offset+5)+"px; top:40%; transform:rotate(-8deg);} }"
    ]
    : [
        "@keyframes fly_"+id+"{from{left:"+offset_left+"px; top:"+offset_top+"px; opacity:0;} to{left:"+(offset_left+getRand(0, 50))+"px; top:100%; opacity:0; transform:rotate(0deg);} 20%{left:"+(offset_left-8)+"px; top:20%; opacity:1; transform:rotate(-4deg);} 30%{left:"+(offset_left)+"px; top:30%; transform:rotate(4deg);} 40%{left:"+(offset_left+8)+"px; top:40%; transform:rotate(6deg);} 50%{left:"+(offset_left)+"px; top:50%;} 60%{left:"+(offset_left-8)+"px; top:60%; transform:rotate(-6deg);} 70%{left:"+(offset_left-2)+"px; top:70%; transform:rotate(-2deg);} 80%{left:"+(offset_left+8)+"px; top:80%; transform:rotate(4deg);} 90%{left:"+(offset_left+12)+"px; top:90%; transform:rotate(8deg); opacity:1;}}",
    ];
       
    return key_set[getRand(0, key_set.length-1)];
}

// randomly show last 2 LEGAL_OPERATIONS matches from  history of all acounts
async function showAccountsHistory(){
    let random_history = new Array();
    for(let acc of ACCOUNTS){
        let history = await steem.api.getAccountHistoryAsync(acc.name, -1, 25);        
        let cnt = 0;
        if(history && history.length > 0){
            for(let item of history){
                if(typeof(item[1].op[0]) !== 'undefined'){
                    if(LEGAL_OPERATIONS.indexOf(item[1].op[0]) !== -1){                        
                        random_history.push([item[1].op[0], item[1].op[1]]);                      
                        cnt++;
                    }
                } 
                if(cnt >= 2){break;}
            }
        }
    }
    random_history = shuffle(random_history);
    
    for(let op of random_history){
        await sleep(2000);
        processOperation(op[0], op[1], true); 
    }
}

// operation info tooltip
function getTooltip(title, tx, is_right){
   
    var tooltip = '<div class="tooltip '+is_right+'"><table>';
    tooltip += '<tr><td colspan="2" class="hd">'+title+'</td></tr>';
    $.each(tx, function(key, value){
         tooltip += '<tr><td>'+key+':</td><td><div>'+value+'</div></td></tr>';
    });
    tooltip += '</table></div>';
    return tooltip;            
}
    
function getRand(min, max) {
    var rand = min + Math.random() * (max + 1 - min);
    rand = Math.floor(rand);
    return rand*1;
}
    


function shuffle(arra1) {
    var ctr = arra1.length, temp, index;
    while (ctr > 0) {
        index = Math.floor(Math.random() * ctr);
        ctr--;
        temp = arra1[ctr];
        arra1[ctr] = arra1[index];
        arra1[index] = temp;
    }
    return arra1;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

