'use strict'

const urlTools = require('./lib/urls')
const getTrending = require('./lib/getTrending')
const getSimilar = require('./lib/getSimilar')
const setClientCache = require('./lib/setClientCache')

var striptags = require('striptags');

// process._debugProcess(process.pid); debugger;

const firstOfEntityRole = function(message, entity, role) {
  role = role || 'generic';
  const slots = message.slots
  const entityValues = message.slots[entity]
  const valsForRole = entityValues ? entityValues.values_by_role[role] : null

  return valsForRole ? valsForRole[0] : null
}

exports.handle = function handle(client) {

    const sendGreeting = client.createStep({
	satisfied() {
	    return Boolean(client.getConversationState().greetingSent)
	},
	
	next() {
	    return 'giftOrPersonal'
	},

	prompt() {
	    client.addResponse('app:response:name:welcome')
	    client.updateConversationState({
		greetingSent: true
	    })
	    client.done()
	    return 'init.proceed' // `next` from this step will get called
	}
    })

    const checkIfGift = client.createStep({
	satisfied() {
	    return (typeof client.getConversationState().isGift !== 'undefined')
	},

	next() {
	    const isGift = client.getConversationState().isGift
	    if (isGift === true) {
		return 'gift'
	    } else if (isGift === false) {
		return 'personal'
	    }
	},
	
	prompt() {
	    let baseClassification = client.getMessagePart().classification.base_type.value
	    if (baseClassification === 'looking_for_gift') {
		console('setting')
		client.updateConversationState({
		    isGift: true,
		})
		return 'init.proceed' // `next` from this step will get called
	    } else if (baseClassification === 'looking_for_myself') {
		console('setting')
		client.updateConversationState({
		    isGift: false,
		})
		return 'init.proceed' // `next` from this step will get called
	    }
	    
	    client.addTextResponse('why not?')
	    client.addResponse('app:response:name:askgift')
	    client.done()
	}
    })

    const collectInterests = client.createStep({
	satisfied() {
	    var foo = (Boolean(client.getConversationState().interest1)||Boolean(client.getConversationState().interest2))
	    // console.log('----------------------------------------checking if collectInterests is done')
	    // console.log(foo)

	    return (Boolean(client.getConversationState().interest1)||Boolean(client.getConversationState().interest2))
	},
	
	next() {
	    return 'provideBookonInterests'
	},

	extractInfo() {
	    console.log('extracting slots')
	    
	    var interest1 = firstOfEntityRole(client.getMessagePart(), 'interest1')
	    if(!interest1) interest1 = ""
	    else { 
		interest1 = interest1.value
		console.log('interest1: ' + interest1)
		client.updateConversationState({
		    interest1: interest1,
		})
	    }

	    var interest2 = firstOfEntityRole(client.getMessagePart(), 'interest2')
	    if(!interest2) interest2 = ""
	    else {
		interest2 = interest2.value
		console.log('interest2: ' + interest2)
		client.updateConversationState({
		    interest2: interest2,
		})
	    }

	    var interest3 = firstOfEntityRole(client.getMessagePart(), 'interest3')
	    if(!interest3) interest3 = ""
	    else { 
		interest3 = interest3.value
		console.log('interest3: ' + interest3)
		client.updateConversationState({
		    interest3: interest3,
		})		
	    }

	    // if(interest3) 
	    // 	client.addTextResponse('(I think you said <' + interest1 + '>, <' + interest2 + '>, <' + interest3 + '>.')
	    // else if (interest2) 
	    // 	client.addTextResponse('(I think you said <' + interest1 + '>, <' + interest2 + '>.')
	    // else if (interest1) 
	    // 	client.addTextResponse('(I think you said <' + interest1 + '>.')
	},
	
	prompt() {
	    client.addResponse('app:response:name:request_interest_list')
	    client.done()
	},
    })

    const provideBookonInterests = client.createStep({
	satisfied() {
	    return false
	},

	prompt(callback) {
	    console.log('extracting slots')

	    var interest1 = client.getConversationState().interest1;
	    var interest2 = client.getConversationState().interest2;
	    var interest3 = client.getConversationState().interest3;

	    if(interest3) 
		client.addTextResponse('(Looking for book about <' + interest1 + '>, <' + interest2 + '> and <' + interest3 + '>.')
	    else if (interest2) 
		client.addTextResponse('(Looking for book about <' + interest1 + '> and <' + interest2 + '>.')
	    else if (interest1) 
		client.addTextResponse('(Looking for book about <' + interest1 + '>.')
	    client.done()
	},
    })

    const askBook = client.createStep({
	satisfied() {
	    return false
	},
	
	prompt() {
	    client.addResponse('app:response:name:ask_liked_book')
	    client.done()
	}
    })
    
    
    
    const rejectReco = client.createStep({
	satisfied() {
	    return false
	},

	prompt(callback) {

	    // if rejection type is bad book, add it to the banned list.
	    // if rejection type is already read, add it to the read list. 
	    // then cough up another one.


	    var base_type = client.getMessagePart().classification.base_type.value
	    var sub_type = client.getMessagePart().classification.sub_type.value
	    console.log(sub_type)
	    if(sub_type == 'bad_recommendation') {
		console.log('bad reco. forget')
	    }
	    else if (sub_type == 'already_read') {
		var bookid = setClientCache.getLastReco(client)
		console.log('recording read of: ' + bookid)
		// this takes book, not bookid
		setClientCache.recordBookRead(client, bookid)
	    }
	    
	    client.addResponse('app:response:name:provide_popular_book', bookData)
	    client.done()
	    callback()
	},
    })

    client.runFlow({
	classifications: {
	},
	autoResponses: {
	},
	streams: {
	    main: 'sendGreetingStream', // sendGreeting,
	    sendGreetingStream: [sendGreeting],
	    giftOrPersonal: [checkIfGift],
	    gift: [collectInterests],
	    personal: [askBook],
	    provideBookonInterests: [provideBookonInterests],

	    //	    end: [provideHelp],
	}
    })
}
