# PM

Fabian Sigfridsson 2024-05-28

## Validering

### Wave

Jag har gjort validering med hjälp av Wave där jag fick info om att jag saknade dokument-titel på alla mina sidor. Efter att jag fixade det problemet så ger

### Mobilanpassning

Mobilanpassning gör via Bootstrap. Jag har använt Bootstrap för nästan all css och då har jag endast behövt ge elementen rätt klasser så fixar bootstrap så att sidan är responsiv.

### HTML validator

Jag har tagit och kopierat html- koden som genereras ut till clienten och klistrat in i [validator.nu](https://validator.nu/#textarea). Jag fick tillbaka ett error

> Attribute ```for``` not allowed on element <button><u>button</u></button> at this point.

Den delen är en del av bootstraps templates och den breakar inte varken sidan eller dens funktion så jag ignorerar det.

## Säkerhet

### Client-side

Jag har gjort ålite client-side validering och gett de nödvändiga input/textarea elementen attributet ```required``` så att om en vanlig användare kommer så kommer den se att det är nödvändigt att fylla i dom. Jag har också satt attributet ```type``` så att det matchar den förväntade typen av input.

### Server-side

Jag har använt express-validator för att göra en första validering av datan. Där kollar jag både längden och typen av datan så att den är okej och så att någon inte försöker göra något fuffens eller förstöra servern eller databasen.

Även om datan är okej så kollar jag också så att användaren har access till olika sidor och att den inte kan ändra på någon annans profil.

### Data och databas

Det mesta hanteras på servern men jag har också gjort lite på databasen är till exempel användarnamn är unika och vissa fält måste få/ha värden för att kunna skapas/updateras och även typen av data som fälten accepterar.

## Lagar och regler

### GDPR

Eftersom min sida sparar email så måste den också följa GDPR-lagarna
Det betyder att jag inte får publicera personlig data så att alla kan komma åt den och att in

### Cookies

När man använder session så behöverr man varna om att cookies används på sidan.

