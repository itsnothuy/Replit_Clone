import React, {ReactNode} from 'react';
import styled from "@emotion/styled";


const Aside = styled.aside`
  width: 250px;
  height: 100vh;
  border-right: 2px solid;
  border-color: #242424;
  padding-top: 3px;
  `

export const Sidebar = ({children}: { children: ReactNode }) => {
return (
    <Aside>
        {children}
    </Aside>
    )   
}

export default Sidebar
