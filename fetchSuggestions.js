var suggest = function (word, limit) {
		//if (!limit) limit = 5;
        limit = 500000;

		//if (this.check(word)) return [];

		// Check the replacement table.
		/*for (var i = 0, _len = this.replacementTable.length; i < _len; i++) {
			var replacementEntry = this.replacementTable[i];

			if (word.indexOf(replacementEntry[0]) !== -1) {
				var correctedWord = word.replace(replacementEntry[0], replacementEntry[1]);

				if (this.check(correctedWord)) {
					return [ correctedWord ];
				}
			}
		}*/

		var self = this;
		self.alphabet = "abcdefghijklmnopqrstuvwxyz";

		function edits1(words) {
			var rv = [];

			for (var ii = 0, _iilen = words.length; ii < _iilen; ii++) {
				var word = words[ii];

				var splits = [];

				for (var i = 0, _len = word.length + 1; i < _len; i++) {
					splits.push([ word.substring(0, i), word.substring(i, word.length) ]);
				}

				var deletes = [];

				for (var i = 0, _len = splits.length; i < _len; i++) {
					var s = splits[i];

					if (s[1]) {
						deletes.push(s[0] + s[1].substring(1));
					}
				}

				var transposes = [];

				for (var i = 0, _len = splits.length; i < _len; i++) {
					var s = splits[i];

					if (s[1].length > 1) {
						transposes.push(s[0] + s[1][1] + s[1][0] + s[1].substring(2));
					}
				}

				var replaces = [];

				for (var i = 0, _len = splits.length; i < _len; i++) {
					var s = splits[i];

					if (s[1]) {
						for (var j = 0, _jlen = self.alphabet.length; j < _jlen; j++) {
							replaces.push(s[0] + self.alphabet[j] + s[1].substring(1));
						}
					}
				}

				rv = rv.concat(deletes);
				rv = rv.concat(transposes);
				rv = rv.concat(replaces);
			}

			return rv;
		}

		function known(words) {
			var rv = [];

			for (var i = 0; i < words.length; i++) {
				//if (self.check(words[i])) {
					rv.push(words[i]);
				//}
			}

			return rv;
		}

		function correct(word) {
			// Get the edit-distance-1 and edit-distance-2 forms of this word.
			var ed1 = edits1([word]);
			var ed2 = edits1(ed1);

			var corrections = known(ed1).concat(known(ed2));

			// Sort the edits based on how many different ways they were created.
			var weighted_corrections = {};

			for (var i = 0, _len = corrections.length; i < _len; i++) {
				if (!(corrections[i] in weighted_corrections)) {
					weighted_corrections[corrections[i]] = 1;
				}
				else {
					weighted_corrections[corrections[i]] += 1;
				}
			}

			var sorted_corrections = [];

			for (var i in weighted_corrections) {
				sorted_corrections.push([ i, weighted_corrections[i] ]);
			}

			function sorter(a, b) {
				if (a[1] < b[1]) {
					return -1;
				}

				return 1;
			}

			sorted_corrections.sort(sorter).reverse();

			var rv = [];

			for (var i = 0, _len = Math.min(limit, sorted_corrections.length); i < _len; i++) {
				//if (!self.hasFlag(sorted_corrections[i][0], "NOSUGGEST")) {
					rv.push(sorted_corrections[i][0]);
				//}
			}

			return rv;
		}

		return correct(word);
	}

// web worker for spell check suggestions
onmessage = function(e) {
    var word = e.data;
    var _initial = new Date();
    var suggestions = suggest(word);
    console.log(suggestions);
    var _final = new Date();
    console.log((_final.getTime() - _initial.getTime())/1000);
    postMessage('HI THERE');
    self.close();
}