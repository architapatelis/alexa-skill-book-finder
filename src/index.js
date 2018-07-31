
var Alexa = require('alexa-sdk');
//var http = require('http');
var https = require('https');
var APP_ID = "YOUR APP ID GOES HERE";



var states = {
    SEARCHMODE: '_SEARCHMODE',
};

var welcomeMessage = "Welcome to Book Finder. You can ask me to recommend books based on genres. For example, recommend fiction books.";

var welcomeRepromt = "You can ask me to recommend books in a specific genre or say help. What will it be?";

var validGenres = "Fiction, Non Fiction, Action, Adventure, Bestsellers, Art, Photography, Biography, Cooking, Crime, History, Humor, Entertainment, Mystery, Nature, Sports, Travel, Fantasy, Law, Science, Math";

var HelpMessage = "<p>" + "Ok. Here's how I can help. I can recommend books based on genres, such as fiction, non fiction, cooking, history, nature and more." + "</p>" + "<p>" + " You can ask me questions such as, Recommend fiction books." + "</p>" + "<p>" + "Check the Alexa App for a more comprehensive list of available genres." + "</p>" + "<p>" + "To get started, ask me to recommend books." + "</p>";

var tryAgainMessage = "please try again.";

var noBookErrorMessage = "There was an error finding a review for this particular book, " + tryAgainMessage;

var goodbyeMessage = "OK, Goodbye!";

var newline = "\n";

var output = "";

var alexa;

var sessionAttributes = {};
sessionAttributes.nextIntentCount = 0;
/******************************************************************************
*/
var newSessionHandlers = {
    'LaunchRequest': function () {
        this.handler.state = states.SEARCHMODE;
        if (sessionAttributes.genreName) {
            delete sessionAttributes.genreName;
        }
        if(sessionAttributes.list_of_books){
            delete sessionAttributes.list_of_books;
        }
        var speechOutput = welcomeMessage;
        var repromptSpeech = "You can ask me to recommend books in a specific genre or say help. What will it be?";
        this.emit(':ask', speechOutput, repromptSpeech);
    },
    'PickGenreIntent': function () {
        this.handler.state = states.SEARCHMODE;
        this.emitWithState('PickGenreIntent');
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', goodbyeMessage);
    },
    'AMAZON.CancelIntent': function () {
        // Use this function to clear up and save any data needed between sessions
        this.emit(":tell", goodbyeMessage);
    },
    'SessionEndedRequest': function () {
        // Use this function to clear up and save any data needed between sessions
        this.emit('AMAZON.StopIntent');
    },
    'Unhandled': function () {
        output = HelpMessage;
        this.emit(':ask', output, welcomeRepromt);
    },
};

/**********************************************************************************
*/
var startSearchHandlers = Alexa.CreateStateHandler(states.SEARCHMODE, {
    'PickGenreIntent': function () {
        //if the user did not pick a genre we have to prompt them to do so.
        if (typeof this.event.request.intent.slots.genre.value === 'undefined'){

            var speechOutput = "What genre would you like to select? For example you can say fiction, non fiction, bestsellers, history, cooking. Check the Alexa App for a more comprehensive list of available genres.";

            //this.emit(':ask', speechOutput);
            var cardTitle = "AVAILABLE GENRES: " + newline;
            var cardContent = validGenres + newline;
            alexa.emit(':askWithCard', speechOutput, speechOutput, cardTitle, cardContent);
        }

        //the user has selected the genre, we have to determine which one it is.
        if (typeof this.event.request.intent.slots.genre.value !== 'undefined'){

            // this is the value of the genre the user selected. e.g. fiction
            var selectedGenre = this.event.request.intent.slots.genre.value;
            selectedGenre = selectedGenre.toLowerCase();
            sessionAttributes.nextIntentCount = 0;

            // match the acceptale API genre values with the genre slot value provided by Alexa.
            switch(selectedGenre) {
                case "fiction":
                    sessionAttributes.genreName = "fiction";
                    break;
                case "non fiction":
                case "nonfiction":
                    sessionAttributes.genreName = "non-fiction";
                    break;
                case "action":
                case "adventure":
                case "action adventure":
                    sessionAttributes.genreName = "action-adventure";
                    break;
                case "bestsellers":
                case "best sellers":
                case "best seller":
                case "bestseller":
                    sessionAttributes.genreName = "bestsellers";
                    break;
                case "art":
                case "arts":
                case "photography":
                    sessionAttributes.genreName = "arts-photography";
                    break;
                case "biography":
                case "biographies":
                case "memoirs":
                    sessionAttributes.genreName = "biographies-memoirs";
                    break;
                case "cooking":
                    sessionAttributes.genreName = "cooking";
                    break;
                case "crime":
                    sessionAttributes.genreName = "crime";
                    break;
                case "history":
                    sessionAttributes.genreName = "history";
                    break;
                case "humor":
                case "entertainment":
                    sessionAttributes.genreName = "humor-entertainment";
                    break;
                case "mystery":
                case "thriller":
                case "suspense":
                    sessionAttributes.genreName = "mystery-thriller-suspense";
                    break;
                case "nature":
                case "wildlife":
                    sessionAttributes.genreName = "nature-wildlife";
                    break;
                case "sports":
                case "sport":
                case "outdoors":
                    sessionAttributes.genreName = "sports-outdoors";
                    break;
                case "travel":
                    sessionAttributes.genreName = "travel";
                    break;
                case "fantasy":
                    sessionAttributes.genreName = "science-fiction-fantasy";
                    break;
                case "law":
                    sessionAttributes.genreName = "law-philosophy";
                    break;
                case "science":
                case "math":
                    sessionAttributes.genreName = "science-math";
                    break;
            }

            // if the user gave an invalid genre value, they will be repromted to give a valid genre.
            if (typeof sessionAttributes.genreName === 'undefined'){
                var speechOutput = "I'm sorry, but I didn't understand the genre you selected. You can say fiction, cooking, history, action. Check the Alexa App for a more comprehensive list of available genres.";
                var cardTitle = "AVAILABLE GENRES: " + newline;
                var cardContent = validGenres + newline;
                alexa.emit(':askWithCard', speechOutput, speechOutput, cardTitle, cardContent);
                return;
            }else{
                // call a function that will take the genreName and pass it to the API URL.
                getListOfBooksJSON(sessionAttributes.genreName, function(response){
                    //once we get the list_of_books from the I Dream Books API we have to present the user with the first five books on that list.
                    var list_of_books = [];
                    var body = JSON.parse(response);


                    if(body === null) {
                        var speechOutput = "I am sorry, there was a problem getting the list of recommendations, please ask again.";
                        alexa.emit(':ask', speechOutput);
                    } else {
                        for (var i = 0; i < body.length; i++ ) {
                            var book = {};

                            var title = body[i].title;
                            book.title = title;
                            book.titleupper = title.toUpperCase();

                            var author = body[i].author;
                            if(author === ""){
                                book.author = "Unknown Author";
                            }else{
                                book.author = author;
                            }

                            var rank = i + 1;
                            book.rank = rank;

                            var description = body[i].review_snippet;
                            if(description === ""){
                                book.description = "Sorry, there is no review for this book."
                            }else {
                                book.description = description;
                            }

                            var reviewed_by = body[i].review_publication_name;
                            if(reviewed_by === ""){
                                book.reviewed_by = "Reviewed by Unknown Publication";
                            }else {
                                book.reviewed_by = reviewed_by;
                            }

                            book.review = book.title + ", written by, " + book.author + ". Has been reviewed by, " + book.reviewed_by + ". Here is a small snippet of that review, ";

                            // within the array list_of_books, each book object will have a title, titleupper, author, rank, description, reviewed_by and details.
                            list_of_books[i] = book;
                        }

                    }
                    //if there are no books in the list_of_books.
                    if (list_of_books.length === 0){
                        var speechOutput = "I am sorry, but at this time, I cannot retrieve a list of books for you. Goodbye.";
                        alexa.emit(':tell', speechOutput);
                    }

                    var genreName = sessionAttributes.genreName;
                    var speechText = "I, Dream Books has compiled " + list_of_books.length + " critically acclaimed books in the " + genreName + " genre. Here are the first five books: ";
                    var start_list = 0;
                    var end_list = 5;
                    var count = 0;

                    //this for loop will get the first five books in the list_of_books array.
                    for (var i = start_list; i < end_list; i++ ) {

                        title = list_of_books[i].title;
                        author = list_of_books[i].author;
                        rank = list_of_books[i].rank;
                        count++

                        sessionAttributes.list_of_books = list_of_books;
                        sessionAttributes.start_list= start_list;
                        sessionAttributes.end_list= end_list;
                        sessionAttributes.count = count;

                        if ( i < end_list ){
                            speechText = speechText + "<p>" + "Number " + rank + "</p>" + "<p>" + title + "</p>" + "<p>" + ", written by " + author + "." + "</p>";
                        }
                    }

                    var repromptSpeech = "<p>" + "To continue, say Next." + "</p>" + "<p>" + "To hear more about these top five books, tell me a number between one and five." + "</p>" + "<p>" + "Or, pick a different genre." + "</p>";

                    if (sessionAttributes.count === 5) {
                        speechText = speechText + '<p>' + repromptSpeech + '</p>';
                    }

                    var speechOutput = speechText;
                    var cardTitle = "YOU CAN SAY: " + newline;
                    var cardContent = "-- Next" + newline + "-- book number two" + newline + "-- recommend cooking" + newline + newline + "AVAILABLE GENRES: " + newline + validGenres + newline;
                    alexa.emit(':askWithCard', speechOutput, repromptSpeech, cardTitle, cardContent);
                });
            }
        }
    },
    'GetReviewIntent': function () {
        this.handler.state = states.SEARCHMODE;
        if (typeof sessionAttributes.genreName === 'undefined'){
            var speechOutput = "I'm sorry. I don't understand your request. In order to hear details about a book you must first ask for a recommendation. For example you can say recommend fiction books. Check the Alexa App for a more comprehensive list of available genres.";
            var cardTitle = "AVAILABLE GENRES: " + newline;
            var cardContent = validGenres + newline;
            alexa.emit(':askWithCard', speechOutput, speechOutput, cardTitle, cardContent);
        }
        var slotValue = this.event.request.intent.slots.booknumber.value;
        var bookNumber = parseInt(slotValue);
        var bookIndex = bookNumber - 1;

        var slotValue = this.event.request.intent.slots.booknumber.value;
        var bookNumber = parseInt(slotValue);
        var index = bookNumber - 1;
        var list_of_books = sessionAttributes.list_of_books;
        var selectedBook = list_of_books[index];
        var start_list = sessionAttributes.start_list;
        var start_at = start_list + 1;
        var end_list = sessionAttributes.end_list;
        if (bookNumber < 1  || bookNumber > end_list) {
            var speechOutput = "You didn't select a number in a valid range. Tell me a number between one and "  + end_list;
            this.emit(':ask', speechOutput);
        }
        if(bookNumber >= 1 && bookNumber <= end_list) {
            if (selectedBook) {
                var titleupper = selectedBook.titleupper;
                var author = selectedBook.author;
                var reviewed_by = selectedBook.reviewed_by
                var description_sentence = selectedBook.description;

                var split_sentences = description_sentence.split(/\?|\.|!/);
                var description = '';
                for(var i = 0; i < split_sentences.length - 1; i++) {
                    description += '<s>' + split_sentences[i] + '</s>';
                }
                var review = selectedBook.review + description;

                if(end_list === list_of_books.length) {
                    var speechOutput = "<emphasis level='moderate'>" + review + "</emphasis>" + "<p>"+ "Would you like to hear another review, for any of these " + list_of_books.length + " books?" + "</p>" + "<p>" + "If so, give me a number between one and " + list_of_books.length + "." + "</p>" + "<p>" + "You can also ask for a new list of recommendations, in a different genre." + "</p>";

                    var cardTitle = "Review for: " + titleupper + newline;
                    var cardContent = "Author: " + author + newline + "Reviewed by: " + reviewed_by + newline + "Review snippet: " + description_sentence + newline + newline + "YOU CAN SAY: " + newline + "-- book number two" + newline + "-- recommend fiction" + newline + newline + "AVAILABLE GENRES: " + newline + validGenres + newline;

                    alexa.emit(':askWithCard', speechOutput, speechOutput, cardTitle, cardContent);
                }else{
                    var speechOutput = "<emphasis level='moderate'>" + review + "</emphasis>" + "<p>" + "Would you like to hear a review for another book? If so, give me a number between " + start_at + " and " + end_list + "." + "</p>" + "<p>" + "Or say Next, if you would like to hear about the next five books in the " + sessionAttributes.genreName + " genre." + "</p>" + "<p>" + "You can also ask for a new list of recommendations, in a different genre." + "</p>";

                    var cardTitle = "Review for: " + titleupper + newline;
                    var cardContent = "Author: " + author + newline + "Reviewed by: " + reviewed_by + newline + "Review snippet: " + description_sentence + newline + newline + "YOU CAN SAY:" + newline + "-- Next" + newline + "-- book number two" + newline + "-- recommend fiction" + newline + newline + "AVAILABLE GENRES: " + newline + validGenres + newline;

                    alexa.emit(':askWithCard', speechOutput, speechOutput, cardTitle, cardContent);
                }
            } else {
                alexa.emit(':ask', noBookErrorMessage);
            }
        }
    },
    'AMAZON.NextIntent': function () {
        if(sessionAttributes.nextIntentCount < 4) {
            sessionAttributes.nextIntentCount++;
            var speechText = "Here are the next five critically acclaimed books in the " + sessionAttributes.genreName + " genre: ";
        	var start_list = parseInt(sessionAttributes.start_list) + 5;
        	var end_list = parseInt(sessionAttributes.end_list) + 5;
        	var list_of_books = sessionAttributes.list_of_books;
            var count = sessionAttributes.count;

        	if (end_list > list_of_books.length){
        		end_list = list_of_books.length;
        	}

        	sessionAttributes.list_of_books = list_of_books;
        	sessionAttributes.start_list= start_list;
        	sessionAttributes.end_list= end_list;

            //you can remove this if condition if need be.
            if(start_list < list_of_books.length){
            	for (var i = start_list; i < end_list; i++ ) {
            		title = list_of_books[i].title;
            		author = list_of_books[i].author;
            		rank = list_of_books[i].rank;
                    count++;

            		speechText = speechText + "<p>" + "Number " + rank + "</p>" + "<p>" + title + "</p>" + "<p>" + ", written by " + author + "." + "</p>";
            	}
            }

            //var start_at = start_list + 1

            if(end_list === list_of_books.length) {
                var repromptSpeech = "<p>" + "You have reached the end of recommendations in the " + sessionAttributes.genreName + " genre. To hear more about one of these books, give me a number between one and " + end_list + "." + "</p>" + "<p>" + " Or, you can ask for a new recommendation. For example say, recommend nature." + "</p>";

                var cardTitle = "YOU CAN SAY:" + newline;
                var cardContent = "-- book number two" + newline + "-- recommend fiction" + newline + "-- Stop" + newline + newline + "AVAILABLE GENRES: " + newline + validGenres + newline;
            }else {
                var repromptSpeech = "<p>" + "To hear more about a book, give me a number between one and " + end_list + "." + "</p>" + "<p>" + "You can say Next, to hear about the next five books." + "</p>" + "<p>" + " Or, you can ask for a new recommendation. For example say, recommend nature." + "</p>";

                var cardTitle = "YOU CAN SAY:" + newline;
                var cardContent = "-- Next" + newline + "-- book number two" + newline + "-- recommend fiction" + newline + newline + "AVAILABLE GENRES: " + newline + validGenres + newline;
            }

            if (sessionAttributes.count === 5) {
                speechText = speechText + '<p>' + repromptSpeech + '</p>';
            }

        	var speechOutput = speechText;
            alexa.emit(':askWithCard', speechOutput, repromptSpeech, cardTitle, cardContent);
        }else {
            var speechOutput = "<p>" + "You have reached the end of recommendations in the " + sessionAttributes.genreName + " genre. To hear more about one of these books, give me a number between one and " + sessionAttributes.list_of_books.length + "." + "</p>" + "<p>" + " Or, you can ask for a new recommendation. For example say, recommend nature." + "</p>";

            var cardTitle = "YOU CAN SAY:" + newline;
            var cardContent = "-- book number two" + newline + "-- recommend fiction" + newline + "-- Stop" + newline + newline + "AVAILABLE GENRES: " + newline + validGenres + newline;
            alexa.emit(':askWithCard', speechOutput, speechOutput, cardTitle, cardContent);
        }
    },
    'AMAZON.YesIntent': function () {
        output = HelpMessage;
        this.emit(':ask', HelpMessage, HelpMessage);
    },
    'AMAZON.NoIntent': function () {
        output = HelpMessage;
        this.emit(':ask', HelpMessage, HelpMessage);
        //this.emit(":tell", goodbyeMessage);
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', goodbyeMessage);
    },
    'AMAZON.HelpIntent': function () {
        var speechOutput = HelpMessage;
        var repromptSpeech = HelpMessage;
        var cardTitle = "HELP";
        var cardContent = "AVAILABLE GENRE: " + newline + newline + validGenres + newline + "----------" + newline + newline +
            "Typical questions include:"+ newline +
            "-- Recommend fiction books" + newline +
            "-- Recommend nature" + newline +
            "-- mystery" + newline;

        alexa.emit(':askWithCard', speechOutput, repromptSpeech, cardTitle, cardContent);
    },
    'AMAZON.CancelIntent': function () {
        // Use this function to clear up and save any data needed between sessions
        if (sessionAttributes.genreName) {
            delete sessionAttributes.genreName;
        }
        if(sessionAttributes.list_of_books){
            delete sessionAttributes.list_of_books;
        }

        this.emit(":tell", goodbyeMessage);
    },
    'SessionEndedRequest': function () {
        // Use this function to clear up and save any data needed between sessions
        if (sessionAttributes.genreName) {
            delete sessionAttributes.genreName;
        }
        if(sessionAttributes.list_of_books){
            delete sessionAttributes.list_of_books;
        }
        this.emit('AMAZON.StopIntent');
    },
    'Unhandled': function () {
        output = HelpMessage;
        this.emit(':ask', output, welcomeRepromt);
    }
});


/**********************************************************************************
*/

exports.handler = function (event, context, callback) {
    alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    alexa.registerHandlers(newSessionHandlers, startSearchHandlers);
    alexa.execute();
};

// Create a web request and handle the response.
//#3 Get the list_of_books array from the I Dream Books API.
function getListOfBooksJSON(genre, callback) {
    var APIKey = "YOUR API KEY GOES HERE";
    https.get('https://idreambooks.com/api/publications/recent_recos.json?key=' + APIKey +'&slug=' + genre, (resp) => {
        var data = '';

        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received.
        resp.on('end', function () {
            callback(data)
        });

    }).on("error", (err) => {
      console.log("Error: " + err.message);
    });
};
 
