"use strict"

import $ from 'jquery'

//Сделано пожилым господином Kappel, спецально для силача Трешмана
export default function startGame () {
  $(document).ready(function () {
    let currentRound = 0;
    const $gameButtons = $(".control-round");
    const $gameContainer = $(".game");

    const $buttonAddPlayer = $(".control-game .control__button_addPlayer");
    const $buttonGiveRoles = $(".control-game .control__button_giveRoles");
    const $buttonStartGame = $(".control-game .control__button_startGame");
    const $buttonResetGame = $(".control-game .control__button_resetGame");

    $buttonAddPlayer.click(function (e) {
      e.preventDefault();
      const currentPlayersNumber = playersNumbers();
      if (currentPlayersNumber === 0) {
        $gameContainer.show();
        $buttonGiveRoles.show();
        $buttonStartGame.show();
        $buttonResetGame.show().prop("disabled", true);
      }
      const playerTools =
        `<div class="player-tools">
				<div class="player-tools__container">
					<div class="player-tools__info">
						<span class="player-tools__index">${currentPlayersNumber + 1}</span>
					</div>
					<div class="player-tools__container player-tools__container_buttons">
						<button class="player-tools__button player-tools__button-big player-tools__button-remove"></button>
						<div class="player-tools__container player-tools__container_small-buttons">
							<button class="player-tools__button player-tools__button-small player-tools__button-up"></button>
							<button class="player-tools__button player-tools__button-small player-tools__button-down"></button>
						</div>
					</div>
				</div>
			</div>`;
      $(".game__container > div:nth-child(1)").append(playerTools);


      const playerName =
        /*`<div class="player_name">
          <input class="player_name__input" type="text">
        </div>`;*/
        `<div class="player-name">
				<div class="player-name__container">
					<input class="player-name__input" type="text">
				</div>
			</div>`
      $(".game__container > div:nth-child(2)").append(playerName);

      const newRoleList = createRoleList();
      $(".game__container > div:nth-child(3)").append(`<div class="player-role">` + newRoleList + '</div>');
      updatePlayersRole();
      setPTButtonsEvents(getElem(currentPlayersNumber + 1, 1, true).find(".player-tools__button"));
    });


    $buttonGiveRoles.click(function (e) {
      const countPlayers = playersNumbers();
      if (countPlayers < 7) {
        return;
      }
      const countRoles = rolesNumbers(countPlayers);

      $(".player-role__option[value=0]").each(function (index, element) {
        $(element).prop("selected", true);
      });
      //1 Мафия, 2 Комиссар 3 Дон, 4 Доктор, 5 Маньяк
      let roles = [];
      let player = [];

      if (countRoles == 2) { roles.push(2, 3); }
      if (countRoles == 3) { roles.push(1, 2, 3); }
      if (countRoles == 5) { roles.push(1, 1, 2, 3, 4); }
      if (countRoles == 6) { roles.push(1, 1, 2, 3, 4, 5); }
      while (player.length < roles.length) {
        const value = getRandomInRange(1, countPlayers);
        if (!player.includes(value)) {
          player.push(value);
        }
      }
      player.forEach((element, index) => {
        getElem(element, 3, true).find(`.player-role__option[value=${roles[index]}]`).prop("selected", true);
      });
    });

    $buttonStartGame.click(function (e) {
      e.preventDefault();
      $gameButtons.show(0);

      $buttonAddPlayer.prop("disabled", true);
      $buttonGiveRoles.prop("disabled", true);
      $buttonStartGame.prop("disabled", true);
      $buttonResetGame.prop("disabled", false);


      getColumn(1, true).find(".player-tools__container_buttons").hide(0);
      getColumn(2, true).find(".player-name__input").prop("disabled", true);
      const $rolesColumn = getColumn(3, true).find(".player-role__select");
      $rolesColumn.prop("disabled", true);

      const $mafiaRoles = $rolesColumn.find(".player-role__option[value=1]:selected, .player-role__option[value=3]:selected")
      $mafiaRoles.each(function (index, element) {
        getStr(getIndexStr($(element)), true).addClass("_mafia");
      });

    });

    $buttonResetGame.click(function (e) {
      e.preventDefault();
      const confirmResult = confirm("Вы уверены?");
      if (confirmResult === false) {
        return;
      }

      $gameButtons.hide(0);

      $buttonAddPlayer.prop("disabled", false);
      $buttonGiveRoles.prop("disabled", false);
      $buttonStartGame.prop("disabled", false);
      $buttonResetGame.prop("disabled", true);

      if (currentRound > 0) {
        const rounds = currentRound;
        currentRound = 0;
        for (let i = 0; i < rounds; ++i) {
          getColumn(1).parent().remove();
        }
      }
      $gameContainer.find("._player-lose").removeClass("_player-lose");
      $gameContainer.find("._mafia").removeClass("_mafia");


      getColumn(1, true).find(".player-tools__container_buttons").show(0);
      getColumn(2, true).find(".player-name__input").prop("disabled", false);
      getColumn(3, true).find(".player-role__select").prop("disabled", false);
    });

    const $nextRoundButton = $('.control-round .control__button_nextRound');
    $nextRoundButton.click(function (e) {
      e.preventDefault();
      currentRound++;
      if (currentRound % 2 != 0) { //День, обрабатываю предыдущую ночь
        if (currentRound >= 3) {
          //Выключаю и прячу невыбранные чекбоксы
          const $checkboxActions = getColumn(currentRound - 1).find(".action-check__input");
          $checkboxActions.each(function (index, element) {
            if ($(element).is(":checked") == false) {
              $(element).parent().hide(0);
            } else {
              $(element).prop("disabled", true);
            }
          });
          //Обработка ночи
          for (let i = 1; i <= playersNumbers(); ++i) {
            if (nightGames(i, currentRound - 1) === false) {
              disablePlayer(i);
            }
          }
        }
        //Создаю раунд дня
        nextRound();
        //Забираю прослушку чекбоксам ночных действий
        removeCheckboxEvent(currentRound - 1);
      } else if (currentRound % 2 == 0) { //Ночь, обрабатываю предыдущий день
        for (let i = 1; i <= playersNumbers(); ++i) {
          const $checkboxVote = getElem(i, currentRound - 1).find(".action-check_court").find(".action-check__input");
          if ($checkboxVote.is(":checked") == true) {
            disablePlayer(i);
            //Выключаю выбранный чекбокс голосования
            $checkboxVote.prop("disabled", true);
          } else if ($checkboxVote.length != 0) {
            //Все остальные прячу
            $checkboxVote.parent().hide(0);
          }
        }
        //Создаю раунд ночи
        nextRound();
        //Выдаю прослушку чекбоксам ночных действий
        setCheckboxEvent(currentRound);
      }
      if (currentRound === 1) {
        $prevRoundButton.prop("disabled", false);
      }
    });

    const $prevRoundButton = $('.control-round .control__button_previousRound');
    $prevRoundButton.click(function (e) {
      e.preventDefault();
      currentRound--;
      getColumn(currentRound + 1).parent().remove();
      if (currentRound % 2 != 0) { //День, обрабатываю текущий день
        for (let i = 1; i <= playersNumbers(); ++i) {
          const $checkboxVote = getElem(i, currentRound).find(".action-check_court").find(".action-check__input");
          if ($checkboxVote.is(":checked") == true) {
            enablePlayer(i);
            $checkboxVote.prop("disabled", false);
          } else if ($checkboxVote.length != 0) {
            $checkboxVote.parent().show();
          }
        }
      } else if (currentRound % 2 == 0) { //Ночь, обрабатываю текущую ночь
        //Включаю кноки выбранных ночных действий
        const $checkboxActions = getColumn(currentRound).find(".action-check__input");
        $checkboxActions.each(function (index, element) {
          if ($(element).is(":checked") == false) {
            $(element).parent().show(0);
          } else {
            $(element).prop("disabled", false);
          }
        });

        for (let i = 1; i <= playersNumbers(); ++i) {
          if (nightGames(i, currentRound) === false) {
            enablePlayer(i);
          }
        }
        setCheckboxEvent(currentRound);
      }
      if (currentRound === 0) {
        $prevRoundButton.prop("disabled", true);
      }
    });

    function setCheckboxEvent(indexRound) {
      const arr = ["mafia", "сommissioner", "don", "doctor", "freak"];
      const $checkboxActions = getColumn(indexRound);

      for (let i = 0; i < arr.length; ++i) {
        const $checkboxActionsRole = $checkboxActions.find(`.action-check_${arr[i]}`).children(".action-check__input");
        $checkboxActionsRole.each(function (index, element) {
          $(element).change(function (e) {
            if ($(element).is(":checked") === true) {
              $checkboxActionsRole.each(function () {
                if ($(this).is($(element)) === false) {
                  $(this).prop("disabled", true).prop('checked', false);
                }
              });
            } else {
              $checkboxActionsRole.each(function () {
                if ($(this).is($(element)) === false) {
                  $(this).prop("disabled", false);
                }
              });
            }
          });

          $(element).parent().children(".action-check__box").mouseover(function () {
            if ($(element).is(":checked") === false && $checkboxActions.find(`.action-check_${arr[i]}`).children(".action-check__input:checked").length != 0) {
              $(element).prop("disabled", false);
            }
          });
          $(element).parent().children(".action-check__box").mouseout(function () {
            if ($(element).is(":checked") === false && $checkboxActions.find(`.action-check_${arr[i]}`).children(".action-check__input:checked").length != 0) {
              $(element).prop("disabled", true);
            }
          });
        });
      }
    }
    function setPTButtonsEvents($buttons) {
      let $upButton = null;
      let $downButton = null;
      let $removeButton = null;
      $buttons.each(function (index, element) {
        if ($(element).hasClass("player-tools__button-remove")) {
          $removeButton = $(element);
        }
        if ($(element).hasClass("player-tools__button-up")) {
          $upButton = $(element);
        }
        if ($(element).hasClass("player-tools__button-down")) {
          $downButton = $(element);
        }
      });
      updateDisabledButtons();
      function updateDisabledButtons() {
        const $toolsColumn = getColumn(1, true);
        $toolsColumn.find(".player-tools__button-small").prop("disabled", false);
        $toolsColumn.first().find(".player-tools__button-up").prop("disabled", true);
        $toolsColumn.last().find(".player-tools__button-down").prop("disabled", true)
      }
      if ($removeButton != null) {
        $removeButton.click(function (e) {
          e.preventDefault();
          const $currentPlayerStr = getStr(getIndexStr($buttons), true);
          $currentPlayerStr.remove();
          updatePlayersRole();
          updatePlayersIndex();
          updateDisabledButtons();
          if (playersNumbers() === 0) {
            $gameContainer.hide();
            $buttonGiveRoles.hide();
            $buttonStartGame.hide();
            $buttonResetGame.hide();
          }
        });
      }
      if ($upButton != null) {
        $upButton.click(function (e) {
          e.preventDefault();
          const indexStr = getIndexStr($buttons);
          if (indexStr === 1) {
            return;
          }
          const $currentTextInput = getElem(indexStr, 2, true).find(".player-name__input");
          const $upTextInput = getElem(indexStr - 1, 2, true).find(".player-name__input");
          const textValue = $upTextInput.val();
          $upTextInput.val($currentTextInput.val());
          $currentTextInput.val(textValue);

          const $currentSelect = getElem(indexStr, 3, true).find(".player-role__select");
          const $upSelect = getElem(indexStr - 1, 3, true).find(".player-role__select");
          const valueOption = $upSelect.children(".player-role__option:selected").val();
          $upSelect.children(`.player-role__option[value=${$currentSelect.children(".player-role__option:selected").val()}]`).prop("selected", true);
          $currentSelect.children(`.player-role__option[value=${valueOption}]`).prop("selected", true);
        });
      }
      if ($downButton != null) {
        $downButton.click(function (e) {
          e.preventDefault();
          const indexStr = getIndexStr($buttons);
          if (indexStr === playersNumbers()) {
            return;
          }
          const $currentTextInput = getElem(indexStr, 2, true).find(".player-name__input");
          const $downTextInput = getElem(indexStr + 1, 2, true).find(".player-name__input");
          const textValue = $downTextInput.val();
          $downTextInput.val($currentTextInput.val());
          $currentTextInput.val(textValue);

          const $currentSelect = getElem(indexStr, 3, true).find(".player-role__select");
          const $downSelect = getElem(indexStr + 1, 3, true).find(".player-role__select");
          const valueOption = $downSelect.children(".player-role__option:selected").val();
          $downSelect.children(`.player-role__option[value=${$currentSelect.children(".player-role__option:selected").val()}]`).prop("selected", true);
          $currentSelect.children(`.player-role__option[value=${valueOption}]`).prop("selected", true);
        });
      }
    }
    function updatePlayersIndex() {
      const $toolsColumn = getColumn(1, true);
      $toolsColumn.each(function (index, element) {
        $(element).find(".player-tools__index").text(index + 1);
      });
    }
    function updatePlayersRole() {
      const newRoleList = createRoleList();
      const $rolesColumn = getColumn(3, true);
      const countRoles = rolesNumbers(playersNumbers());
      let countMafia = 0;
      if (countRoles === 3) { countMafia = 1; }
      if (countRoles === 5 || countRoles === 6) { countMafia = 2; }
      $rolesColumn.each(function (index, element) {
        const value = $(element).find(".player-role__option:selected").val();
        $(element).html(newRoleList);
        if (value != 1 || (value == 1 && countMafia > 0)) {
          $(element).find(`.player-role__option[value=${value}]`).prop("selected", true);
          if (value == 1) {
            countMafia--;
          }
        }
      });
    }
    function nextRound() {
      const players = playersNumbers();
      let next =
        `<div class="game__item">
				<div class="column-info">
					<div class="column-info__container">
						<span class="column-info__text">${(currentRound % 2 != 0 ? ("Д " + ((currentRound - currentRound % 2) / 2 + 1)) : "Н " + currentRound / 2)}</span>
					</div>
				</div>`;
      if (currentRound % 2 != 0) {
        for (let i = 1; i <= players; ++i) {
          next += createDayActionList(i);
        }
      }
      else {
        for (let i = 1; i <= players; ++i) {
          next += createNightActionList(i);
        }
      }
      next += `</div>`;

      const $prevRound = getColumn(currentRound - 1);
      $prevRound.parent().after(next);
    }
    function removeCheckboxEvent(indexRound) {
      const arr = ["mafia", "сommissioner", "don", "doctor", "freak"];
      const $checkboxActions = getColumn(indexRound);

      for (let i = 0; i < arr.length; ++i) {
        const $checkboxActionsRole = $checkboxActions.find(`.action-check_${arr[i]}`).children(".action-check__input");
        $checkboxActionsRole.each(function (index, element) {
          $(element).unbind("change");
          $(element).parent().children(".action-check__box").unbind('mouseover').unbind('mouseout');
        });
      }
    }
    function getRandomInRange(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    function playersNumbers() {
      return $(".game__container > div:nth-child(1) > div").length - 1;
    }
    function rolesNumbers(countPlayers) {
      if (countPlayers === 7) { return 2; }
      if (7 < countPlayers && countPlayers < 10) { return 3; }
      if (10 <= countPlayers && countPlayers < 12) { return 5; }
      if (12 <= countPlayers) { return 6; }
      return 0;
    }
    function createRoleList() {
      const value = playersNumbers();
      let result =
        `<div class="player-role__container">
				<select class="player-role__select">
					<option class="player-role__option" value="0">&nbsp;</option>`;
      if (value <= 7) {
        result +=
          `<option class="player-role__option" value="2">Комиссар</option>
				<option class="player-role__option" value="3">Дон</option>`;
      }
      else if (value > 7) {
        result +=
          `<option class="player-role__option" value="1">Мафия</option>
				<option class="player-role__option" value="2">Комиссар</option>
				<option class="player-role__option" value="3">Дон</option>`;
      }
      if (value >= 10) {
        result += `<option class="player-role__option" value="4">Доктор</option>`;
      }
      if (value >= 12) {
        result += `<option class="player-role__option" value="5">Маньяк</option>`;
      }
      result +=
        `</select>
			</div>`;
      return result;
    }
    function createDayActionList(index) {
      let optionalRoles = '';
      let flagLose = false;
      const $toolsColumn = getElem(index, 1, true);
      if ($toolsColumn.hasClass("_player-lose") == true) {
        optionalRoles += "_player-lose";
        flagLose = true;
      }
      if ($toolsColumn.hasClass("_mafia")) {
        optionalRoles += " _mafia";
      }
      let dayAction =
        `<div class="player-action ${optionalRoles}">
				<div class="player-action__container">`;
      if (flagLose == false) {
        dayAction +=
          `<label class="action-check action-check_court">
					<input class="action-check__input" type="checkbox">
					<span class="action-check__box"></span>
				</label>`;
      }
      dayAction +=
        `</div>
			</div>`;
      return dayAction;
    }
    function createNightActionList(index) {
      let optionalRoles = '';
      let flagLose = false;
      const $toolsColumn = getElem(index, 1, true);
      if ($toolsColumn.hasClass("_player-lose") == true) {
        optionalRoles += "_player-lose";
        flagLose = true;
      }
      if ($toolsColumn.hasClass("_mafia")) {
        optionalRoles += " _mafia";
      }
      const selectedActiveRoles = getActiveSelectedRoles();
      let result =
        `<div class="player-action ${optionalRoles}">
				<div class="player-action__container">`;
      if (flagLose == false && (selectedActiveRoles.includes(1) || selectedActiveRoles.includes(3))) {
        result +=
          `<label class="action-check action-check_mafia">
					<input class="action-check__input" type="checkbox">
					<span class="action-check__box"></span>
				</label>`;
      }
      if (selectedActiveRoles.includes(2)) {
        result +=
          `<label class="action-check action-check_сommissioner">
					<input class="action-check__input" type="checkbox">
					<span class="action-check__box"></span>
				</label>`;
      }
      if (selectedActiveRoles.includes(3)) {
        result +=
          `<label class="action-check action-check_don">
					<input class="action-check__input" type="checkbox">
					<span class="action-check__box"></span>
				</label>`;
      }
      if (flagLose == false && selectedActiveRoles.includes(4)) {
        result +=
          `<label class="action-check action-check_doctor">
					<input class="action-check__input" type="checkbox">
					<span class="action-check__box"></span>
				</label>`;
      }
      if (flagLose == false && selectedActiveRoles.includes(5)) {
        result +=
          `<label class="action-check action-check_freak">
					<input class="action-check__input" type="checkbox">
					<span class="action-check__box"></span>
				</label>`;
      }
      result +=
        `</div>
			</div>`;
      return result;
    }
    function disablePlayer(index) {
      getStr(index, true).addClass("_player-lose");
    }
    function enablePlayer(index) {
      getStr(index, true).removeClass("_player-lose");
    }
    //Возвращает true или false если игрок в конкретной ночи выживыет или нет, соответственно
    function nightGames(indexStr, indexColumn) {
      const $player = getElem(indexStr, indexColumn);
      //Считываю чекбоксы (true/false) действий
      const mafia = $player.find(".action-check_mafia").children(".action-check__input").is(":checked");
      const doctor = $player.find(".action-check_doctor").children(".action-check__input").is(":checked");
      const freak = $player.find(".action-check_freak").children(".action-check__input").is(":checked");
      if ((doctor === false || typeof doctor === 'undefined') && (mafia === true || freak === true)) {
        return false;
      }
      return true;
    }
    function getSelectedRoles() {
      const valuesSelectedRoles = [];
      const $selectedRoles = getColumn(3, true).find(".player-role__option:selected");
      $selectedRoles.each(function (index, element) {
        if ($(this).val() != 0) {
          valuesSelectedRoles.push(parseInt($(this).val()));
        }
      });
      return valuesSelectedRoles;
    }

    function getActiveSelectedRoles() {
      const valuesActiveSelectedRoles = [];
      const $selectedActiveRoles = getColumn(3, true).parent().children("div:not(._player-lose)").find(".player-role__option:selected");
      $selectedActiveRoles.each(function (index, element) {
        if ($(element).val() != 0) {
          valuesActiveSelectedRoles.push(parseInt($(element).val()));
        }
      });
      return valuesActiveSelectedRoles;
    }

    function getStr(indexStr, withServiceInfo = false) {
      if (withServiceInfo == true) {
        return $(`.game__container > div:not(.control-round) > div:nth-child(${indexStr + 1})`);
      }
      return $(`.game__container > div:not(.control-round):gt(2) > div:nth-child(${indexStr + 1})`);
    }
    function getColumn(indexColumn, withServiceInfo = false) {
      const index = (withServiceInfo === true ? 0 : 3);
      return $(`.game__container > div:nth-child(${indexColumn + index}):not(.control-round) > div:not(.column-info)`);
    }
    function getElem(indexStr, indexColumn, withServiceInfo = false) {
      const index = (withServiceInfo == true ? 0 : 3);
      return $(`.game__container > div:nth-child(${indexColumn + index}):not(.control-round) > div:nth-child(${indexStr + 1})`);
    }
    function getIndexStr($tableSelector) {
      const $gameItemChildren = getColumn(getIndexColumn($tableSelector), true);
      let indexStr = NaN;
      $gameItemChildren.each(function (index, element) {
        if ($(element).find($tableSelector).length !== 0) {
          indexStr = index + 1;
          return;
        }
      });
      return indexStr;
    }
    function getIndexColumn($tableSelector) {
      let $gameItem = null;
      if ($tableSelector.hasClass("game__item") === false) {
        $gameItem = $tableSelector.parents(".game__item");
      } else {
        $gameItem = $tableSelector;
      }

      const countColmns = $(".game__container .game__item").length;
      for (let i = 1; i <= countColmns; ++i) {
        if ($gameItem.is(getColumn(i, true).parent()) === true) {
          return i;
        }
      }
      return NaN;
    }
  });
}
