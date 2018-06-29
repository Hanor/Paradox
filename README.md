# Paradox
    Allen algorithm, Maintaining Knowledge about Temporal Intervals 
    This implementation was made with Node.js as backend and Angular 6 to the frontend.
    The more important file that is the truly allen algorithn implementation, is in engine/alleAlgorithm/temporal.mjs
    - The principal part of the allen algorithm is in execute method , the execute is the "path consistent" and we are using the last normal(not reversed) relation beetween two nodes;
# Awesome

# To execute
    You need the Node.js installed in your machine.
    
    To do this type in a terminal: npm start
    or you can do this manualy:
        1 - npm install
        2 - npm install -g @angular/cli
        3 - cd interface && ng build
        4 - node --experimental-modules engine/main.mjs

    The application will open a server in the host machine listening on port 80. You can change the application port just editing the application.yml file.
    To test if the application is realy running, just open in a browser: 127.0.0.1/api/paradox ou apenas acessando 127.0.0.1 =)
# Enjoy