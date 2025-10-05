import '@/scss/style.scss'
import startGame from '@/game'

import addSVG from '@svg/button/add.svg'
import leftArrowSVG from '@svg/button/left-arrow.svg'
import rightArrowSVG from '@svg/button/right-arrow.svg'

document.querySelector('#app').innerHTML = /*html*/`
	<div class="control control-game">
		<div class="control__container">
			<button class="control__button control__button_addPlayer" type="button">
				<img class="control__img" src="${addSVG}" alt="add" />
			</button>

			<button class="control__button control__button_giveRoles" type="button">Раздать роли</button>

			<button class="control__button control__button_startGame" type="button">Начать игру</button>

			<button class="control__button control__button_resetGame" type="button">Заново</button>
		</div>
	</div>

	<div class="game">
		<div class="game__container">
			<div class="game__item">
				<div class="column-info">
					<div class="column-info__container">
						<span class="column-info__text">&nbsp;</span>
					</div>
				</div>
			</div>
			<div class="game__item">
				<div class="column-info">
					<div class="column-info__container">
						<span class="column-info__text">Игроки</span>
					</div>
				</div>
			</div>
			<div class="game__item">
				<div class="column-info">
					<div class="column-info__container">
						<span class="column-info__text">Роли</span>
					</div>
				</div>
			</div>
			<div class="control control-round">
				<div class="control__container">
					<button class="control__button control__button_nextRound" type="button">
						<img src="${rightArrowSVG}" alt="right" class="control__img" />
					</button>
					<button class="control__button control__button_previousRound" disabled type="button">
						<img src="${leftArrowSVG}" alt="left" class="control__img" />
					</button>
				</div>
			</div>
		</div>
	</div>
`

startGame()
