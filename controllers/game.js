'use strict';

(angular
    .module(appName)
    .controller('GameCtrl', function($scope, $sce)
	{
		let fenStartStr = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

		$scope.gridRows = [];
		$scope.currCell = {'x': 0, 'y': 0};
		$scope.currPlayer = '';
		$scope.currPiece = '';
		$scope.playerNames = {'B': 'Black', 'W': 'White'};
		$scope.gridRanks = {1: '8', 2: '7', 3: '6', 4: '5', 5: '4', 6: '3', 7: '2', 8: '1'};
		$scope.gridFiles = {1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E', 6: 'F', 7: 'G', 8: 'H'};
		$scope.showDialogue = false;
		$scope.gameLog = [];
		$scope.gameStatus = '';
		$scope.movesCount = 0;
		// $scope.enPassant = {'player': '', 'x': 0, 'y': 0};

		$scope.dlgPopup = {
			top: '',
			width: '',
			height: '',
			title: '',
			template: '',
			noCloseBtn: false,
			important: false,
		};

		$scope.dlgFormFields = [];

		function openDialogue(config) {
			$scope.dlgPopup.top = (config.top || '0px');
			$scope.dlgPopup.width = config.width + 'px';
			$scope.dlgPopup.height = config.height + 'px';
			$scope.dlgPopup.left = (-1 * (config.width / 2)) + 'px';
			$scope.dlgPopup.title = (config.title || '');
			$scope.dlgPopup.template = $sce.trustAsHtml(config.template);
			$scope.dlgPopup.noCloseBtn = (config.noCloseButton || false);
			$scope.dlgPopup.important = (config.important || false),
			$scope.dlgFormFields = [];
			$scope.showDialogue = true;
		}

		function appendLog(msg) {
			$scope.gameLog.push(msg);
		}

		function setPieces() {
			const pieceRows = fenStartStr.split(' ')[0].split('/');
			const rows = [];

			for (let i of pieceRows) {
				const pieces = i.split('');
				const cols = [];

				for (const j of pieces) {
					if (!isNaN(j)) {
						for (let k = 1; k <= parseInt(j); k++)
							cols.push({'player': '', 'piece': ''});
					}
					else {
						switch (j) {
							case 'p': { cols.push({'player': 'B', 'piece': 'pawn'}); break; }
							case 'r': { cols.push({'player': 'B', 'piece': 'rook'}); break; }
							case 'n': { cols.push({'player': 'B', 'piece': 'knight'}); break; }
							case 'b': { cols.push({'player': 'B', 'piece': 'bishop'}); break; }
							case 'q': { cols.push({'player': 'B', 'piece': 'queen'}); break; }
							case 'k': { cols.push({'player': 'B', 'piece': 'king'}); break; }
							case 'P': { cols.push({'player': 'W', 'piece': 'pawn'}); break; }
							case 'R': { cols.push({'player': 'W', 'piece': 'rook'}); break; }
							case 'N': { cols.push({'player': 'W', 'piece': 'knight'}); break; }
							case 'B': { cols.push({'player': 'W', 'piece': 'bishop'}); break; }
							case 'Q': { cols.push({'player': 'W', 'piece': 'queen'}); break; }
							case 'K': { cols.push({'player': 'W', 'piece': 'king'}); break; }
						}
					}
				}

				rows.push(cols);
			}

			for (let r = 0; r < 8; r++) {
				for (let c = 0; c < 8; c++) {
					const cell = $scope.gridRows[r][c];

					cell.player = rows[r][c].player;
					cell.piece = rows[r][c].piece;
				}
			}
		}

		function savePieces() {
			// console.log('savePieces');

			let fenSaveStr = '';
			let piecesStr = '';

			const pieces = {
				'B': {
					'pawn': 'p',
					'rook': 'r',
					'knight': 'n',
					'bishop': 'b',
					'queen': 'q',
					'king': 'k',
				},
				'W': {
					'pawn': 'P',
					'rook': 'R',
					'knight': 'N',
					'bishop': 'B',
					'queen': 'Q',
					'king': 'K',
				},
			};

			for (const row of $scope.gridRows) {
				let emptyCount = 0;
				let foundPiece = '';

				for (const col of row) {
					if (col.piece)
						piecesStr += pieces[col.player][col.piece];
					else
						emptyCount++;

					if (foundPiece)
						emptyCount = 0;
				}

				if (emptyCount > 0)
					piecesStr += emptyCount;

				piecesStr += '/';
			}

			fenSaveStr += piecesStr.substring(0, piecesStr.length - 1) + ' ';
			fenSaveStr += $scope.currPlayer.toLowerCase() + ' ';
			fenSaveStr += 'KQkq ';
			fenSaveStr += '- ';
			fenSaveStr += '0 ';
			fenSaveStr += $scope.movesCount;

			console.log(fenSaveStr);
		}

		function newGame() {
			$scope.gridRows = [];
			$scope.currPlayer = '';

			for (let y = 1; y <= 8; y++) {
				let row = [];

				for (let x = 1; x <= 8; x++) {
					let cssClass = '';

					if (y % 2 != 0) {
						if (x % 2 != 0)
							cssClass = 'wht';
						else
							cssClass = 'blk';
					}
					else if (y % 2 == 0) {
						if (x % 2 == 0)
							cssClass = 'wht';
						else
							cssClass = 'blk';
					}

					row.push({
						'x': x,
						'y': y,
						'rank': $scope.gridRanks[y],
						'file': $scope.gridFiles[x],
						'player': '',
						'piece': '',
						'threat': {'B': false, 'W': false},
						'canMoveTo': false,
						'selected': false,
						'firstMove': (y == 1 || y == 2 || y == 7 || y == 8),
						'enPassant': false,
						'cssClass': cssClass,
					});
				}

				$scope.gridRows.push(row);
			}

			setPieces();
			nextPlayer();
		}

		function nextPlayer() {
			if ($scope.currPlayer == 'W')
				$scope.currPlayer = 'B';
			else
				$scope.currPlayer = 'W';

			$scope.gameStatus = $scope.playerNames[$scope.currPlayer] + '\'s move';
			$scope.movesCount++;

			savePieces();
		}

		function clearCell(cellX, cellY) {
			for (const row of $scope.gridRows) {
				for (const col of row) {
					if (col.x == cellX && col.y == cellY) {
						col.player = '';
						col.piece = '';
						col.selected = '';
						col.canMoveTo = false;
						col.firstMove = false;
						col.enPassant = false;
						break;
					}
				}
			}
		}

		function resetPieceMoves() {
			for (const row of $scope.gridRows) {
				for (const col of row)
					col.canMoveTo = false;
			}
		}

		function calcPieceMoves(cell) {
			const dir = {'B': 1, 'W': -1};

			resetPieceMoves();

			if (cell.piece == 'pawn') {
				let pieceBlocking = false;

				for (let i = 1; i <= 2; i++) {
					const nextCell = (dir[$scope.currPlayer] * i);

					if (pieceBlocking || i == 2 && !cell.firstMove)
						break;

					for (const row of $scope.gridRows) {
						for (const col of row) {
							if (col.x == cell.x && col.y == (cell.y + nextCell)) {
								if (col.piece)
									pieceBlocking = true;
								else
									col.canMoveTo = true;
							}

							if (
								col.y == (cell.y + dir[$scope.currPlayer]) && (
								(col.x == (cell.x + 1) && col.piece && col.player != $scope.currPlayer) ||
								(col.x == (cell.x - 1) && col.piece && col.player != $scope.currPlayer)
							)) {
								col.canMoveTo = true;
							}
						}
					}
				}
			}

			if (cell.piece == 'knight') {
				for (const row of $scope.gridRows) {
					for (const col of row) {
						if (
							(col.y == (cell.y + 2) && (col.x == cell.x + 1 || col.x == cell.x - 1)) ||
							(col.y == (cell.y - 2) && (col.x == cell.x + 1 || col.x == cell.x - 1)) ||
							(col.x == (cell.x + 2) && (col.y == cell.y + 1 || col.y == cell.y - 1)) ||
							(col.x == (cell.x - 2) && (col.y == cell.y + 1 || col.y == cell.y - 1))
						) {
							if (col.player != cell.player)
								col.canMoveTo = true;
						}
					}
				}
			}

			if (cell.piece == 'rook' || cell.piece == 'queen' || cell.piece == 'king') {
				let stopN = false;
				let stopE = false;
				let stopS = false;
				let stopW = false;

				for (let n = cell.y - 1; n > 0; n--) {
					for (const row of $scope.gridRows) {
						for (const col of row) {
							if (col.x == cell.x && col.y == n && !stopN) {
								if (col.piece || cell.piece == 'king') {
									if (col.player != $scope.currPlayer)
										col.canMoveTo = true;

									stopN = true;
								}
								else {
									col.canMoveTo = true;
								}
							}
						}
					}
				}

				for (let e = cell.x + 1; e <= 8; e++) {
					for (const row of $scope.gridRows) {
						for (const col of row) {
							if (col.x == e && col.y == cell.y && !stopE) {
								if (col.piece || cell.piece == 'king') {
									if (col.player != $scope.currPlayer)
										col.canMoveTo = true;

									stopE = true;
								}
								else {
									col.canMoveTo = true;
								}
							}
						}
					}
				}

				for (let s = cell.y + 1; s <= 8; s++) {
					for (const row of $scope.gridRows) {
						for (const col of row) {
							if (col.x == cell.x && col.y == s && !stopS) {
								if (col.piece || cell.piece == 'king') {
									if (col.player != $scope.currPlayer)
										col.canMoveTo = true;

									stopS = true;
								}
								else {
									col.canMoveTo = true;
								}
							}
						}
					}
				}

				for (let w = cell.x - 1; w > 0; w--) {
					for (const row of $scope.gridRows) {
						for (const col of row) {
							if (col.x == w && col.y == cell.y && !stopW) {
								if (col.piece || cell.piece == 'king') {
									if (col.player != $scope.currPlayer)
										col.canMoveTo = true;

									stopW = true;
								}
								else {
									col.canMoveTo = true;
								}
							}
						}
					}
				}
			}

			if (cell.piece == 'bishop' || cell.piece == 'queen' || cell.piece == 'king') {
				let stopNE = false;
				let stopSE = false;
				let stopSW = false;
				let stopNW = false;

				for (let n = cell.y - 1, e = cell.x + 1; (n > 0 && e <= 8); n--, e++) {
					for (const row of $scope.gridRows) {
						for (const col of row) {
							if (col.x == e && col.y == n && !stopNE) {
								if (col.piece || cell.piece == 'king') {
									if (col.player != $scope.currPlayer)
										col.canMoveTo = true;

									stopNE = true;
								}
								else {
									col.canMoveTo = true;
								}
							}
						}
					}
				}

				for (let s = cell.y + 1, e = cell.x + 1; (s <= 8 && e <= 8); s++, e++) {
					for (const row of $scope.gridRows) {
						for (const col of row) {
							if (col.x == e && col.y == s && !stopSE) {
								if (col.piece || cell.piece == 'king') {
									if (col.player != $scope.currPlayer)
										col.canMoveTo = true;

									stopSE = true;
								}
								else {
									col.canMoveTo = true;
								}
							}
						}
					}
				}

				for (let s = cell.y + 1, w = cell.x - 1; (s <= 8 && w > 0); s++, w--) {
					for (const row of $scope.gridRows) {
						for (const col of row) {
							if (col.x == w && col.y == s && !stopSW) {
								if (col.piece || cell.piece == 'king') {
									if (col.player != $scope.currPlayer)
										col.canMoveTo = true;

									stopSW = true;
								}
								else {
									col.canMoveTo = true;
								}
							}
						}
					}
				}

				for (let n = cell.y - 1, w = cell.x - 1; (n > 0 && w > 0); n--, w--) {
					for (const row of $scope.gridRows) {
						for (const col of row) {
							if (col.x == w && col.y == n && !stopNW) {
								if (col.piece || cell.piece == 'king') {
									if (col.player != $scope.currPlayer)
										col.canMoveTo = true;

									stopNW = true;
								}
								else {
									col.canMoveTo = true;
								}
							}
						}
					}
				}
			}
		}

		function capturePiece(cell, player, piece) {
			appendLog($scope.playerNames[player] + ' ' + piece + ' takes ' + $scope.playerNames[cell.player] + ' ' + cell.piece);
			clearCell(cell.x, cell.y);
		}

		function showPromoteDialogue(cell) {
			const pieces = ['queen', 'bishop', 'rook', 'knight'];

			openDialogue({
				width: 200,
				height: 0,
				top: '30%',
				title: 'Promote Pawn',
				template:
					'<strong>Select piece to promote to</strong>' +
					'<br />' +
					'<br />' +
				'',
				important: true,
				noCloseButton: true,
			});

			for (const i of pieces) {
				$scope.dlgFormFields.push({
					'type': 'button',
					'click': {'fn': promotePiece, 'params': [i, cell.x, cell.y, $scope.currPlayer]},
					'html': $sce.trustAsHtml('<img src="./img/piece_' + i + '-' + $scope.currPlayer + '.svg" />'),
					'cssClass': 'promotePieceBtn',
				});
			}
		}

		function promotePiece(params) {
			const newPiece = params[0];
			const cellX = params[1];
			const cellY = params[2];
			const player = params[3];

			for (const row of $scope.gridRows) {
				for (const col of row) {
					if (col.x == cellX && col.y == cellY) {
						col.piece = newPiece;
						break;
					}
				}
			}

			appendLog($scope.playerNames[player] + ' ' + $scope.currPiece + ' promoted to ' + newPiece);

			$scope.closeDialogue();
		}

		$scope.cellClick = function(cell) {
			if (cell.canMoveTo) {
				appendLog($scope.playerNames[$scope.currPlayer] + ' ' + $scope.currPiece + ' to ' + cell.file + cell.rank);

				if (cell.piece && cell.player != $scope.currPlayer)
					capturePiece(cell, $scope.currPlayer, $scope.currPiece);

				for (const row of $scope.gridRows) {
					for (const col of row) {
						if (col.x == cell.x && col.y == cell.y) {
							col.player = $scope.currPlayer;
							col.piece = $scope.currPiece;
						}
					}
				}

				// cell.player = $scope.currPlayer;
				// cell.piece = $scope.currPiece;

				if (cell.piece == 'pawn') {
					switch ($scope.currPlayer) {
						case 'B': {
							if (cell.rank == 1)
								showPromoteDialogue(cell);

							break;
						}
						case 'W': {
							if (cell.rank == 8)
								showPromoteDialogue(cell);

							break;
						}
					}
				}

				clearCell($scope.currCell.x, $scope.currCell.y);
				resetPieceMoves();
				nextPlayer();
			}
			else if (cell.piece) {
				resetPieceMoves();

				if (cell.player == $scope.currPlayer) {
					if (!cell.selected) {
						$scope.currCell.x = cell.x;
						$scope.currCell.y = cell.y;
						$scope.currPiece = cell.piece;

						resetPieceMoves();
						calcPieceMoves(cell);
					}

					for (const row of $scope.gridRows) {
						for (const col of row) {
							if (col.x == cell.x && col.y == cell.y)
								col.selected = !col.selected;
							else
								col.selected = false;
						}
					}
				}
			}
		};

		$scope.showAboutDlg = function() {
			openDialogue({
				width: 200,
				height: 120,
				top: '30%',
				title: 'About',
				template:
					'<strong>Chess</strong>' +
					'<br />' +
					'<br />' +
					'Version 1.0' +
					'<br />' +
					'Ben Meakings' +
				'',
			});
		};

		$scope.dialogueOverlayClick = function() {
			if (!$scope.dlgPopup.important)
				$scope.closeDialogue();
		};

		$scope.closeDialogue = function() {
			$scope.showDialogue = false;
		};

		newGame();
	})
);
